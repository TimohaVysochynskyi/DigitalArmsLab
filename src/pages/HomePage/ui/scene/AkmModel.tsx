/* eslint-disable react-hooks/immutability --
   керування анімаціями three.js — імперативне мутування AnimationAction/mixer (штатний
   патерн three, а не React-стан), тож правило тут незастосовне. */

/* АКМ — одна модель на два слоти (Features і CTA).

   Анімація геометрії — ВИКЛЮЧНО зашитими кліпами glb, окремі вузли не чіпаємо:
     Features            — кліп `idle` (зброя зібрана й нерухома);
     Features → CTA      — кліп `diassemble`, прокручений скролом, із фрізом у кінці.

   Рух у Features — рух ГРУПИ, а не деталей. Три ЗУПИНКИ (по одній на картку): поки картка
   тримається, модель стоїть на своїй позі й лише ледь «дихає» по нахилу/крену (без обертання
   по Y). На зміні картки вона ПЛАВНО перетікає у наступну позу — доворот по Y + зміна нахилу
   + невелике зміщення. Рух не прив'язаний до позиції скролу: модель доганяє ціль із власною
   інерцією (`damp`), як на преміальних сайтах.

   Розмір: слот у CSS — справжній габарит моделі. Фіт рахується для ОПОРНОЇ пози (чистий
   профіль — найширший силует) і тримається СТАЛИМ: за будь-якого доворотa модель не вилазить
   за слот і не «дихає» розміром. Для CTA фіт — по РОЗІБРАНОМУ силуету. */

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations } from "@react-three/drei";
import { useGltfModel } from "@/shared/Scene3D";
import {
  Vector3,
  Euler,
  Quaternion,
  Group,
  PerspectiveCamera,
  LoopOnce,
} from "three";
import { useTunedMaterials } from "@/shared/Scene3D";
import type { AkmSlotKey, Choreo } from "./types";
import { AKM_SLOT_ID } from "./types";
import type { Silhouette } from "./math";
import {
  clamp01,
  damp,
  fitToBox,
  lerp,
  modelBounds,
  modelSilhouettes,
  smoothstep,
} from "./math";

const MODEL_URL = "/models/akm.ktx2.glb";

const DEG = Math.PI / 180;

// Профіль до глядача (дефолт моделі — ствол уперед / приклад до нас).
const FACING: [number, number, number] = [0, -Math.PI / 2, 0];

/* Матеріали: делікатне відбиття оточення + послаблений рельєф і піднята шорсткість.
   Останні два прибирають мерехтіння блиску на дрібному рельєфі; дерево від цього ще й
   виглядає матовішим і природнішим, без глянцевих «бардових» відблисків. */
const MATERIALS = {
  envMapIntensity: 0.5,
  normalScale: 0.8,
  roughnessBoost: 1.15,
};

// Точні назви кліпів усередині akm.glb (саме `diassemble`, з помилкою — так у моделі).
const CLIP = { idle: "idle", disassemble: "diassemble" } as const;

// Поріг мобільної версії АКМ (збігається з колонковою версткою Features ≤768).
const MOBILE_MAX_WIDTH = 768;
// Нижче цієї ширини CTA теж лишається ВЕРТИКАЛЬНОЮ (без «лягання» в горизонталь) — так
// розібрану зброю на вузькому екрані видно більшою й краще.
const CTA_VERTICAL_MAX_WIDTH = 600;
// Екранний поворот на мобільному: зброя стає ВЕРТИКАЛЬНОЮ й заповнює висоту вузького екрана.
const MOBILE_ROLL = Math.PI / -3;

/* Кути пози в порядку Euler "ZXY":
     yaw   — оберт навколо ВЛАСНОЇ вертикалі (яким боком зброя до нас);
     pitch — нахил до/від камери: + показує зброю зверху;
     roll  — оберт силуету в площині екрана. */
type Angles = { yaw: number; pitch: number; roll: number };

/** Зупинка (по одній на картку): ракурс + зміщення центру у частках в'юпорту. */
type StepPose = Angles & { offX: number; offY: number };

/* Опорна поза для ВПИСУВАННЯ: чистий профіль (yaw 0) — найширший силует. Масштаб рахуємо
   під нього й далі тримаємо СТАЛИМ, тож за будь-якого доворотa модель не вилазить за слот. */
const PROFILE_POSE: Angles = { yaw: 0, pitch: 0, roll: 0 };

const TUNE = {
  /* Три ЗУПИНКИ — по одній на картку. Поки картка тримається, модель стоїть на своїй позі і
     лише ледь «дихає» по нахилу/крену (БЕЗ обертання по Y). На переході до наступної картки
     плавно ПЕРЕТІКАЄ у наступну позу: помітний доворот по Y + зміна нахилу + невелике
     зміщення. Рух НЕ прив'язаний жорстко до скролу — модель доганяє ціль із власною
     інерцією (`damp`), як на преміальних сайтах.
       yaw — АБСОЛЮТНИЙ (не по колу): різниця між зупинками = величина й напрям доворотa;
       offX/offY — зміщення центру у частках в'юпорту. */
  steps: [
    { yaw: -135 * DEG, pitch: 5 * DEG, roll: -3 * DEG, offX: 0.13, offY: 0.0 },
    { yaw: 35 * DEG, pitch: 10 * DEG, roll: 5 * DEG, offX: 0.05, offY: 0.1 },
    { yaw: 205 * DEG, pitch: -2 * DEG, roll: -7 * DEG, offX: 0.06, offY: 0.03 },
  ] as StepPose[],

  /* Компактні екрани (≤1024): ті самі ракурси, але БЕЗ бокових/вертикальних зсувів — модель
     стоїть по центру слота (картка вгорі/зліва, зброя під/за нею). Художні зсуви десктопа на
     вузьких екранах виштовхували б її вбік. */
  compactSteps: [
    { yaw: -135 * DEG, pitch: 5 * DEG, roll: -3 * DEG, offX: 0, offY: 0 },
    { yaw: 35 * DEG, pitch: 10 * DEG, roll: 5 * DEG, offX: 0, offY: 0 },
    { yaw: 205 * DEG, pitch: -2 * DEG, roll: -7 * DEG, offX: 0, offY: 0 },
  ] as StepPose[],

  /* Оглядова поза в CTA — «на столі»: затвором до юзера + невеликий кут по двох осях (нахил
     згори + легкий крен), щоб розібрані деталі читались як розкладені на столі. Позицію
     зводимо в ЦЕНТР екрана (див. useFrame). */
  cta: {
    yaw: 185 * DEG,
    pitch: -18 * DEG,
    roll: -6 * DEG,
    offX: 0,
    offY: 0,
  } as StepPose,

  /** Множник розміру моделі в CTA — щоб розібрана зброя добре вписалась «на столі». */
  ctaSizeMul: 0.85,

  /** Інерція «допливання» пози (наздоганянь за сек, як у дрона): менше = повільніше/тягучіше.
     Ціль — БЕЗПЕРЕРВНА scroll-поза (`poseAt`), тож рух і плавний, і на весь скрол. */
  glide: 3,

  /** «Живий» мікрорух під час зупинки — лише по нахилу/крену/висоті, без Y. */
  idle: { pitch: 1.4 * DEG, roll: 1.0 * DEG, float: 0.006, speed: 0.55 },
};

const toEuler = ({ yaw, pitch, roll }: Angles) =>
  new Euler(pitch, yaw, roll, "ZXY");

/** Лінійна інтерполяція двох зупинок (поза + зміщення центру). */
const lerpStep = (a: StepPose, b: StepPose, t: number): StepPose => ({
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  roll: lerp(a.roll, b.roll, t),
  offX: lerp(a.offX, b.offX, t),
  offY: lerp(a.offY, b.offY, t),
});

/* Поза на прогресі піна Features (0..1) — БЕЗПЕРЕРВНА інтерполяція по ланцюжку зупинок:
   рух розтягнутий рівно на весь скрол, а не сконцентрований на переходах між картками. */
const poseAt = (spin: number, steps: StepPose[]): StepPose => {
  const s = clamp01(spin) * (steps.length - 1);
  const i = Math.min(steps.length - 2, Math.floor(s));
  return lerpStep(steps[i], steps[i + 1], smoothstep(s - i));
};

const slotRect = (slot: AkmSlotKey) =>
  document.getElementById(AKM_SLOT_ID[slot])?.getBoundingClientRect() ?? null;

const AkmModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const root = useRef<Group>(null);
  const pose = useRef<Group>(null);
  const model = useRef<Group>(null);
  const { scene, animations } = useGltfModel(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, model);
  const { camera, size } = useThree();

  const projected = useMemo(() => new Vector3(), []);

  /* Центр і радіус моделі. Знімаються з bind-пози: pivot — це лише сталий зсув примітива
     (на точність вписування не впливає, бо fitToBox сам центрує видимий силует), а радіус
     задає межі бінів по глибині й від пози не залежить. */
  const bounds = useMemo(() => modelBounds(scene), [scene]);

  /* Програє рівно ОДИН зашитий кліп у заданій точці. Решту зупиняємо, щоб службові
     пер-об'єктні дії з експорту не домішувались і не рухали деталі поза сценарієм. */
  const playClip = useMemo(
    () => (name: string, scrub: number) => {
      const action = actions[name];
      if (!action) return;

      for (const other in actions) {
        if (other !== name) actions[other]?.stop();
      }

      action.enabled = true;
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.paused = true;
      if (!action.isRunning()) action.play();
      action.time = clamp01(scrub) * action.getClip().duration;
      mixer.update(0);
    },
    [actions, mixer],
  );

  /* Профіль силуету в поточному стані вузлів. Поза = FACING + заданий ракурс, а `screenRoll`
     (оберт навколо осі погляду, ЗОВНІШНІЙ) дає ВЕРТИКАЛЬНИЙ силует для мобільної версії. */
  const snapshot = useMemo(
    () =>
      (pose: Angles, screenRoll = 0) => {
        const full = new Euler().setFromQuaternion(
          new Quaternion()
            .setFromEuler(new Euler(0, 0, screenRoll))
            .multiply(new Quaternion().setFromEuler(toEuler(pose)))
            .multiply(new Quaternion().setFromEuler(new Euler(...FACING))),
        );

        return modelSilhouettes(scene, bounds.pivot, bounds.radius, [full])[0];
      },
    [scene, bounds],
  );

  useTunedMaterials(scene, MATERIALS);

  /* Профілі силуету для обох слотів.

     Знімаються НЕ в useEffect, а в кадрі — і це принципово. Кліпи цієї моделі лишають
     вузли там, де їх покинули (`stop()` не завжди відкочує), тож стан вузлів у момент
     монтування не збігається з тим, що реально малюється. Знімок, зроблений у кадрі
     одразу після playClip, гарантовано описує саме те, що видно: інакше вписування
     рахувалось по геометрії, якої в кадрі немає, і зменшувало модель. */
  const silhouettes = useRef<{
    features?: Silhouette;
    featuresV?: Silhouette;
    cta?: Silhouette;
    ctaV?: Silhouette;
  }>({});
  const lastClip = useRef({ name: "", scrub: -1 });

  /* Згладжена (з інерцією) поза — доганяє scroll-цільову `keyPose`, як у дрона: рух «допливає»,
     а не жорстко прибитий покадрово до скролу. Мутабельна, без ре-рендерів. */
  const smooth = useRef<StepPose | null>(null);

  /* Знімок обох силуетів. Кожен вимагає поставити відповідний кліп у потрібну точку
     (idle для Features, кінець diassemble для CTA), тож порядок важливий; наприкінці
     повертаємо зброю в idle. */
  const computeSilhouettes = useMemo(
    () => () => {
      playClip(CLIP.idle, 0);
      silhouettes.current.features = snapshot(PROFILE_POSE);
      silhouettes.current.featuresV = snapshot(PROFILE_POSE, MOBILE_ROLL);
      playClip(CLIP.disassemble, 1);
      silhouettes.current.cta = snapshot(TUNE.cta);
      silhouettes.current.ctaV = snapshot(TUNE.cta, MOBILE_ROLL);
      playClip(CLIP.idle, 0);
      lastClip.current = { name: CLIP.idle, scrub: 0 };
    },
    [playClip, snapshot],
  );

  /* Рахуємо профілі У ПРОСТОЇ, наперед — а не на першому видимому кадрі. Прохід по геометрії
     двічі (features + cta) коштує помітного CPU-часу, і робити його в момент появи моделі
     означало б повернути фриз рівно туди, звідки ми прибираємо лаг компіляції шейдерів. */
  useEffect(() => {
    if (silhouettes.current.features) return;
    const run = () => {
      if (!silhouettes.current.features) computeSilhouettes();
    };
    const request = window.requestIdleCallback;
    if (!request) {
      const timer = window.setTimeout(run, 200);
      return () => clearTimeout(timer);
    }

    const handle = request(run, { timeout: 2000 });
    return () => window.cancelIdleCallback?.(handle);
  }, [computeSilhouettes]);

  /* Слот Features живе всередині `position: sticky`, тож його документна координата
     змінюється щопікселя скролу, а екранна — ні. Тому беремо ЖИВИЙ екранний rect і
     рахуємо фіт щокадру: по силуетному профілю це кілька сотень операцій. */
  const fitSlot = (
    slot: AkmSlotKey,
    silhouette: Silhouette,
    worldPerPx: number,
    cameraZ: number,
  ) => {
    const rect = slotRect(slot);
    if (!rect) return null;

    const boxHeight = rect.height * worldPerPx;
    const { scale, positionX, positionY } = fitToBox(
      silhouette,
      rect.width * worldPerPx,
      boxHeight,
      cameraZ,
      (rect.left + rect.width / 2 - size.width / 2) * worldPerPx,
      (size.height / 2 - (rect.top + rect.height / 2)) * worldPerPx,
    );

    return { scale, x: positionX, y: positionY, boxHeight };
  };

  useFrame((state, delta) => {
    const group = root.current;
    if (!group) return;

    const choreo = choreoRef.current;
    if (!choreo.akmVisible) {
      group.visible = false;
      return;
    }

    /* Кліпи: у Features зброя зібрана (`idle`), а розбирання веде той самий прогрес,
       що й переліт у CTA. Чіпаємо мікшер лише коли стан реально змінився. */
    const scrub = clamp01(choreo.akmFlow);
    const clip = scrub > 0 ? CLIP.disassemble : CLIP.idle;
    if (
      clip !== lastClip.current.name ||
      Math.abs(scrub - lastClip.current.scrub) > 0.0005
    ) {
      lastClip.current = { name: clip, scrub };
      playClip(clip, scrub);
    }

    // Страховка: якщо простій ще не встиг прорахувати силуети — рахуємо зараз (на практиці
    // не спрацьовує, бо useEffect робить це задовго до появи моделі у Features).
    if (!silhouettes.current.features) {
      computeSilhouettes();
      playClip(clip, scrub);
      group.visible = false;
      return;
    }

    const camera3d = camera as PerspectiveCamera;
    const worldPerPx =
      (2 * Math.tan((camera3d.fov * Math.PI) / 180 / 2) * camera3d.position.z) /
      size.height;

    // ≤768 — зброя ВЕРТИКАЛЬНА у Features; ≤600 — вертикальна і в CTA. Для вертикалі вписуємо
    // ПОВЕРНУТИЙ силует (він високий → зброя заповнює висоту вузького екрана).
    const isMobile = size.width <= MOBILE_MAX_WIDTH;
    const ctaVertical = size.width <= CTA_VERTICAL_MAX_WIDTH;
    const featuresSil = (
      isMobile ? silhouettes.current.featuresV : silhouettes.current.features
    )!;
    const ctaSil = (
      ctaVertical ? silhouettes.current.ctaV : silhouettes.current.cta
    )!;

    const features = fitSlot(
      "features",
      featuresSil,
      worldPerPx,
      camera3d.position.z,
    );
    const cta = fitSlot("cta", ctaSil, worldPerPx, camera3d.position.z);
    const from = features ?? cta;
    if (!from) {
      group.visible = false;
      return;
    }
    const to = cta ?? from;

    const flow = smoothstep(scrub);

    /* Поза БЕЗПЕРЕРВНО йде за скролом (scrub його вже згладжує): у Features — по ланцюжку
       зупинок, у переході в CTA — від останньої зупинки до оглядової пози. Жодних дискретних
       «тримань» і різких доворотів на межах карток — рух розтягнутий рівно на весь скрол. */
    const stepSet = size.width <= 1024 ? TUNE.compactSteps : TUNE.steps;
    const keyPose =
      flow > 0
        ? lerpStep(stepSet[stepSet.length - 1], TUNE.cta, flow)
        : poseAt(choreo.akmSpin, stepSet);

    /* Інерція «допливання» (як у дрона): рендеримо не сиру scroll-ціль, а згладжений стан, що
       доганяє її. Перший кадр — снап без глайду. */
    if (!smooth.current) smooth.current = { ...keyPose };
    const sp = smooth.current;
    sp.yaw = damp(sp.yaw, keyPose.yaw, TUNE.glide, delta);
    sp.pitch = damp(sp.pitch, keyPose.pitch, TUNE.glide, delta);
    sp.roll = damp(sp.roll, keyPose.roll, TUNE.glide, delta);
    sp.offX = damp(sp.offX, keyPose.offX, TUNE.glide, delta);
    sp.offY = damp(sp.offY, keyPose.offY, TUNE.glide, delta);

    // «Живий» мікрорух під час зупинки — лише по нахилу/крену/висоті, БЕЗ Y.
    const t = state.clock.elapsedTime;
    const wobblePitch = Math.sin(t * TUNE.idle.speed) * TUNE.idle.pitch;
    const wobbleRoll = Math.cos(t * TUNE.idle.speed * 0.9) * TUNE.idle.roll;
    const wobbleFloat = Math.sin(t * TUNE.idle.speed * 1.1) * TUNE.idle.float;

    // Позиція: у Features — центр слота + зміщення зупинки. У переході/CTA зводимо модель у
    // ЦЕНТР екрана (щоб фокус був на розбиранні). Але щойно бокс CTA підіймається ВИЩЕ центра
    // (секція поїхала вгору) — їдемо разом із ним, щоб піти з екрана, а не зависнути над Contacts.
    const ctaX = to.x;
    const ctaY = Math.max(0, to.y);
    group.position.set(
      lerp(from.x, ctaX, flow) + sp.offX * size.width * worldPerPx,
      lerp(from.y, ctaY, flow) +
        (sp.offY + wobbleFloat) * size.height * worldPerPx,
      0,
    );
    group.scale.setScalar(lerp(from.scale, to.scale * TUNE.ctaSizeMul, flow));

    // Екранний поворот (зовнішня група). ≤600 — вертикаль І у Features, І в CTA (сталий roll,
    // без unwind). 601–768 — Features вертикальна, у CTA плавно «лягає» в горизонталь (unwind
    // по flow). Десктоп — 0. Поза — на внутрішній групі.
    const screenRoll = ctaVertical
      ? MOBILE_ROLL
      : isMobile
        ? lerp(MOBILE_ROLL, 0, flow)
        : 0;

    /* Зовнішня група: екранний roll + РУЧНИЙ доворот користувача — у СКРАННІЙ системі координат
       (порядок "YXZ": спершу roll робить модель вертикальною, далі pitch навколо ЕКРАННОЇ
       горизонталі та yaw навколо ЕКРАННОЇ вертикалі). Завдяки цьому на мобільному, де модель
       повернута roll'ом, перетягування лишається природним — а не «як на десктопі, але
       повернуте на кут». Ручний доворот діє лише в CTA (масштаб flow: у Features — нуль). */
    // Ручний доворот діє лише в CTA і лише НЕ на телефоні (≤600 він заважав скролу — вимкнено).
    const manualScale = ctaVertical ? 0 : flow;
    const manualYaw = choreo.akmManualYaw * manualScale;
    const manualPitch = choreo.akmManualPitch * manualScale;
    group.rotation.set(manualPitch, manualYaw, screenRoll, "YXZ");

    // Внутрішня група — «режисерська» поза (доворот оглядового столу + мікрорух), БЕЗ ручного.
    pose.current?.rotation.set(
      sp.pitch + wobblePitch,
      sp.yaw,
      sp.roll + wobbleRoll,
      "ZXY",
    );

    // Показуємо лише коли модель реально у в'юпорті (щоб було видно переліт).
    projected.copy(group.position).project(camera3d);
    group.visible =
      Math.abs(projected.x) < 2 && Math.abs(projected.y) < 2 && projected.z < 1;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={pose}>
        <group ref={model} rotation={FACING}>
          <primitive
            object={scene}
            position={[-bounds.pivot.x, -bounds.pivot.y, -bounds.pivot.z]}
          />
        </group>
      </group>
    </group>
  );
};

export default AkmModel;
