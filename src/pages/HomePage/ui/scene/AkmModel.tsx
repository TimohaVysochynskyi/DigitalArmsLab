/* eslint-disable react-hooks/immutability --
   керування анімаціями three.js — імперативне мутування AnimationAction/mixer (штатний
   патерн three, а не React-стан), тож правило тут незастосовне. */

/* АКМ — одна модель на два слоти (Features і CTA).

   Анімація геометрії — ВИКЛЮЧНО зашитими кліпами glb, окремі вузли не чіпаємо:
     Features            — кліп `idle` (зброя зібрана й нерухома);
     Features → CTA      — кліп `diassemble`, прокручений скролом, із фрізом у кінці.

   Рух у Features — це рух ГРУПИ, а не деталей: повільний доворот і підйом «оглядового
   столу» через три презентаційні ракурси (по одному на картку), без зупинок між ними.
   Модель тут майже на весь кадр, тому амплітуди навмисно малі: великий об'єкт, що сильно
   крутиться, читається як нестабільний, а не як важкий.

   Розмір: слот у CSS — це справжній габарит моделі (вписування `contain` з поправкою на
   перспективу, як у дрона). Для Features фіт рахується для ОПОРНОЇ пози (майже профіль —
   найширший ракурс) і далі тримається сталим: інакше модель «дихала» б розміром під час
   доворотів. Для CTA фіт рахується по РОЗІБРАНОМУ силуету, щоб деталі не вилізли за бокс. */

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
const MATERIALS = { envMapIntensity: 0.5, normalScale: 0.8, roughnessBoost: 1.15 };

// Точні назви кліпів усередині akm.glb (саме `diassemble`, з помилкою — так у моделі).
const CLIP = { idle: "idle", disassemble: "diassemble" } as const;

/* Пози. Кути в порядку Euler "ZXY" — ті самі три незалежні ручки, що й у дрона:
     yaw   — оберт навколо ВЛАСНОЇ вертикалі (яким боком зброя до нас);
     pitch — нахил до/від камери: + показує зброю зверху;
     roll  — оберт силуету в площині екрана.
   lift — підйом у частках висоти слота. */
type Pose = { yaw: number; pitch: number; roll: number; lift: number };

const TUNE = {
  /* Три презентаційні ракурси Features — по одному на картку; між ними інтерполяція,
     тож оберт безперервний, а не східчастий. Кути малі свідомо: зброя займає майже весь
     кадр, і великий доворот з'їдав би її довжину перспективою.
       01 «Інтерактивні 3D-моделі» — майже чистий профіль: найвпізнаваніший силует;
       02 «Анімація збірки/розбірки» — доворот і погляд зверху, наче зброя лягла на стіл;
       03 «Теоретичний матеріал» — глибше 3/4 з невеликим креном: вигляд «на вивчення». */
  featuresPoses: [
    { yaw: -3 * DEG, pitch: 3 * DEG, roll: -1 * DEG, lift: -0.03 },
    { yaw: -16 * DEG, pitch: 14 * DEG, roll: -3 * DEG, lift: 0.01 },
    { yaw: -30 * DEG, pitch: 9 * DEG, roll: -6 * DEG, lift: 0.05 },
  ] as Pose[],

  /* Фінальна поза в CTA — оглядова: доворот у 3/4 з поглядом трохи зверху, щоб розібрані
     деталі читались окремо одна від одної. */
  ctaPose: { yaw: -20 * DEG, pitch: 18 * DEG, roll: 0, lift: 0 } as Pose,

  /** Ледь помітне «дихання», щоб модель не виглядала замерзлою, коли скрол зупинився. */
  breathing: { amplitude: 0.4 * DEG, speed: 0.5 },
};

const toEuler = ({ yaw, pitch, roll }: Pose) =>
  new Euler(pitch, yaw, roll, "ZXY");

const lerpPose = (from: Pose, to: Pose, t: number): Pose => ({
  yaw: lerp(from.yaw, to.yaw, t),
  pitch: lerp(from.pitch, to.pitch, t),
  roll: lerp(from.roll, to.roll, t),
  lift: lerp(from.lift, to.lift, t),
});

/** Поза на прогресі піна Features: рухаємось по ланцюжку ракурсів із м'яким переходом. */
const featuresPoseAt = (spin: number): Pose => {
  const poses = TUNE.featuresPoses;
  const segments = poses.length - 1;
  const scaled = clamp01(spin) * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));

  return lerpPose(poses[index], poses[index + 1], smoothstep(scaled - index));
};

const slotRect = (slot: AkmSlotKey) =>
  document.getElementById(AKM_SLOT_ID[slot])?.getBoundingClientRect() ?? null;

const AkmModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const root = useRef<Group>(null);
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

  /** Профіль силуету в поточному стані вузлів. Поза = FACING моделі + заданий ракурс. */
  const snapshot = useMemo(
    () => (pose: Pose) => {
      const facing = new Euler(...FACING);
      const full = new Euler().setFromQuaternion(
        new Quaternion()
          .setFromEuler(toEuler(pose))
          .multiply(new Quaternion().setFromEuler(facing)),
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
  const silhouettes = useRef<{ features?: Silhouette; cta?: Silhouette }>({});
  const lastClip = useRef({ name: "", scrub: -1 });

  /* Знімок обох силуетів. Кожен вимагає поставити відповідний кліп у потрібну точку
     (idle для Features, кінець diassemble для CTA), тож порядок важливий; наприкінці
     повертаємо зброю в idle. */
  const computeSilhouettes = useMemo(
    () => () => {
      playClip(CLIP.idle, 0);
      silhouettes.current.features = snapshot(TUNE.featuresPoses[0]);
      playClip(CLIP.disassemble, 1);
      silhouettes.current.cta = snapshot(TUNE.ctaPose);
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

  useFrame((state) => {
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

    const features = fitSlot(
      "features",
      silhouettes.current.features,
      worldPerPx,
      camera3d.position.z,
    );
    const cta = fitSlot(
      "cta",
      silhouettes.current.cta!,
      worldPerPx,
      camera3d.position.z,
    );
    const from = features ?? cta;
    if (!from) {
      group.visible = false;
      return;
    }
    const to = cta ?? from;

    const flow = smoothstep(scrub);

    // Поза: ланцюжок ракурсів Features → оглядова поза CTA.
    const pose =
      flow > 0
        ? lerpPose(featuresPoseAt(1), TUNE.ctaPose, flow)
        : featuresPoseAt(choreo.akmSpin);

    group.position.set(
      lerp(from.x, to.x, flow),
      lerp(from.y, to.y, flow) + pose.lift * from.boxHeight,
      0,
    );
    group.scale.setScalar(lerp(from.scale, to.scale, flow));

    // «Дихання» — окремо від хореографії, щоб модель жила навіть на зупиненому скролі.
    const breath =
      Math.sin(state.clock.elapsedTime * TUNE.breathing.speed) *
      TUNE.breathing.amplitude;
    group.rotation.set(
      pose.pitch + breath,
      pose.yaw,
      pose.roll + breath * 0.5,
      "ZXY",
    );

    // Показуємо лише коли модель реально у в'юпорті (щоб було видно переліт).
    projected.copy(group.position).project(camera3d);
    group.visible =
      Math.abs(projected.x) < 2 &&
      Math.abs(projected.y) < 2 &&
      projected.z < 1;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={model} rotation={FACING}>
        <primitive
          object={scene}
          position={[-bounds.pivot.x, -bounds.pivot.y, -bounds.pivot.z]}
        />
      </group>
    </group>
  );
};

export default AkmModel;
