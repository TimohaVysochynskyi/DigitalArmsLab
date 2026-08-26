/* Дрон (без зашитих анімацій).

   Hero — позиція І розмір беруться з DOM-боксу `#drone-slot-hero` (порожній absolute-div
   у розмітці Hero): дрон вписується у цей бокс за принципом `contain`. Тобто композиція
   Hero тюниться в CSS, а не константами тут. У TS лишається лише ПОЗА (кути).

   Далі поведінка не змінилась:
   Десктоп (>768) — при скролі «влітає» у праву частину About і їде РАЗОМ з нею
   (choreo.droneProgress), −30% розміру. Мобайл (≤768) — спускається СТРОГО по центру через
   About (фаза 1, droneProgress), потім довертається у вид ЗГОРИ (top-down) у окремій
   геп-зоні `#drone-gap` між About і Features (фаза 2, choreo.droneGap); сталий скейл,
   ×1.5 більший. + легкий «ховер».

   rotation навколо власного центра моделі (recenter -pivot); якщо оберт ексцентричний —
   у Blender: Object → Set Origin → Origin to Geometry, переекспорт. */

import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGltfModel, useTunedMaterials } from "@/shared/Scene3D";
import { Box3, Vector3, Euler, Group, PerspectiveCamera } from "three";
import type { Choreo } from "./types";
import { DRONE_SLOT_ID } from "./types";
import { clamp01, damp, fitToBox, lerp, modelBounds, modelSilhouettes } from "./math";
import { usePointerAim } from "./usePointerAim";

const MODEL_URL = "/models/drone.ktx2.glb";

/* Матеріали дрона раніше не налаштовувались узагалі — звідси найсильніше мерехтіння
   блиску на дрібному рельєфі. Значення трохи стриманіші, ніж в АКМ: у дрона багато
   дрібних пазів і глянцевий пластик. */
const MATERIALS = { envMapIntensity: 0.45, normalScale: 0.7, roughnessBoost: 1.2 };

const DEG = Math.PI / 180;

// Поріг мобільної гілки ДРОНА. Свідомо не 600, як в АКМ: у Hero саме на 768 верстка
// перебудовується (subtitle їде вниз, кнопка в центр), тож дрон має перемикатись разом з нею.
const MOBILE_MAX_WIDTH = 768;

// Еталонний кадр, під який підібрано розмір дрона в About/геп-зоні (як у ScenePage):
// розмір = розмір на еталоні × коефіцієнт вписування min(1, w/1920, h/1080).
// Hero під це НЕ підпадає — там розмір диктує бокс слота.
const REF = { width: 1920, height: 1080 };

/* Поза дрона. Кути застосовуються в порядку Euler "ZXY", тобто:
     yaw   — оберт навколо ВЛАСНОЇ вертикалі дрона (яким боком він до нас);
     pitch — нахил до/від камери (екранна вісь X): + піднімає ніс, показує верх;
     roll  — оберт силуету В ПЛОЩИНІ ЕКРАНА (як повернути фото).
   Такий порядок дає незалежні, передбачувані ручки — крутити можна кожну окремо. */
type Pose = { yaw: number; pitch: number; roll: number };

const TUNE = {
  // --- Hero (позиція/розмір — з CSS-боксу слота, тут лише ракурс) ---
  heroPose: {
    // Десктоп: 3/4 спереду-зліва, ніс із підвісом камери — вправо-вниз до глядача.
    desktop: { yaw: -50 * DEG, pitch: 22 * DEG, roll: -6 * DEG } as Pose,
    // Мобайл: майже фронтально, лише злегка згори.
    mobile: { yaw: -90 * DEG, pitch: 18 * DEG, roll: 0 } as Pose,
  },
  /** Частка боксу слота, яку займає силует дрона (1 = впритул до країв). */
  heroFill: 1,

  // --- About / геп-зона (без змін) ---
  // Точка приземлення в About (частка боксу секції): правий-центр, урівень з контентом.
  aboutAnchor: [0.72, 0.5] as [number, number],
  aboutYaw: -Math.PI / 2 - 40 * DEG,
  // Висота моделі як частка висоти еталона (1080) в About; на десктопі ще ×0.7.
  sizeFrac: 0.25,
  aboutSizeMul: 0.7,
  hover: { amplitude: 0.06, speed: 1.1 },

  /** Інерція «допливання»: дрон доганяє ціль скролу плавно, а не прибитий до неї
     покадрово (менше = повільніше й «важче»). Дає преміальний плавний рух. */
  glide: 3,

  /* Легке стеження за курсором у Hero: дрон ЛЕДЬ довертається, наче камера веде за
     вказівником. Свідомо не прямий трекінг — лише невеликий доворот від базової пози,
     інакше читається як дешевий «парallax-віджет», а не як важкий апарат у повітрі.
     yaw/pitch/roll — максимальний доворот на самому краю екрана;
     damping — швидкість наздоганяння (менше = ліниво й «важко», більше = різко). */
  pointerAim: {
    yaw: 6 * DEG,
    // Pitch навмисно менший за yaw: дрон — пласка «пластина» майже з ребра, тож той самий
    // кут по вертикалі змінює силует у рази сильніше (±3.5° давало +20% висоти проти
    // +3% ширини — читалось як кивання, а не як поворот камери).
    pitch: 2 * DEG,
    roll: 2 * DEG,
    damping: 2.2,
  },
  mobileSizeMul: 1.5, // ×1.5 більший на мобайлі
  gapPitch: Math.PI / 2, // 90° — верхом до нас (вид згори) у геп-зоні
  gapYaw: -Math.PI / 2 - Math.PI, // крутимо ВЛІВО далі до ~180° від Hero (без реверсу назад)
};

const rectCenter = (id: string) => {
  const rect = document.getElementById(id)?.getBoundingClientRect();
  if (!rect) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
};

const DroneModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const root = useRef<Group>(null);
  const model = useRef<Group>(null);
  const { scene } = useGltfModel(MODEL_URL);
  const { camera, size } = useThree();
  useTunedMaterials(scene, MATERIALS);
  const aim = usePointerAim();
  // Згладжений курсор — окремо від «сирого», щоб дрон наздоганяв його з інерцією.
  const aimed = useRef({ x: 0, y: 0 });
  /* Згладжений стан хореографії — доганяє ціль скролу з інерцією («допливання»). */
  const smooth = useRef<{
    x: number;
    y: number;
    scale: number;
    yaw: number;
    pitch: number;
    roll: number;
  } | null>(null);

  /* Центр моделі + профілі силуету обох Hero-поз. Рахується ОДНИМ проходом по геометрії
     (див. modelSilhouettes): окремі проходи на кожну позу коштували секундного фризу
     в момент появи моделі. За готовим профілем вписування в бокс уже настільки дешеве,
     що виконується щокадру. */
  const geometry = useMemo(() => {
    const height = new Box3().setFromObject(scene).getSize(new Vector3()).y || 1;
    const toEuler = ({ yaw, pitch, roll }: Pose) =>
      new Euler(pitch, yaw, roll, "ZXY");
    const { pivot, radius } = modelBounds(scene);
    const [desktop, mobile] = modelSilhouettes(scene, pivot, radius, [
      toEuler(TUNE.heroPose.desktop),
      toEuler(TUNE.heroPose.mobile),
    ]);

    return { pivot, height, heroSilhouette: { desktop, mobile } };
  }, [scene]);

  useFrame((state, delta) => {
    const group = root.current;
    const inner = model.current;
    if (!group || !inner) return;

    // Тягнемо курсор навіть коли дрона не видно — інакше він повертався б у кадр ривком.
    aimed.current.x = damp(
      aimed.current.x,
      aim.current.x,
      TUNE.pointerAim.damping,
      delta,
    );
    aimed.current.y = damp(
      aimed.current.y,
      aim.current.y,
      TUNE.pointerAim.damping,
      delta,
    );

    const choreo = choreoRef.current;
    group.visible = choreo.droneVisible;
    if (!choreo.droneVisible) return;

    const p = clamp01(choreo.droneProgress);
    const camera3d = camera as PerspectiveCamera;
    const worldPerPx =
      (2 * Math.tan((camera3d.fov * Math.PI) / 180 / 2) * camera3d.position.z) /
      size.height;
    const viewportFit = Math.min(
      1,
      size.width / REF.width,
      size.height / REF.height,
    );
    const isMobile = size.width <= MOBILE_MAX_WIDTH;

    // --- Hero: центр і розмір із боксу слота (contain-фіт силуету в поточній позі) ---
    const heroPose = isMobile ? TUNE.heroPose.mobile : TUNE.heroPose.desktop;
    const heroSlot = rectCenter(DRONE_SLOT_ID);

    let heroX = size.width * 0.5;
    let heroY = size.height * 0.5;
    let heroScale =
      (TUNE.sizeFrac * REF.height * viewportFit * worldPerPx) / geometry.height;

    if (heroSlot) {
      const { scale, positionX, positionY } = fitToBox(
        isMobile
          ? geometry.heroSilhouette.mobile
          : geometry.heroSilhouette.desktop,
        heroSlot.rect.width * worldPerPx * TUNE.heroFill,
        heroSlot.rect.height * worldPerPx * TUNE.heroFill,
        camera3d.position.z,
        (heroSlot.x - size.width / 2) * worldPerPx,
        (size.height / 2 - heroSlot.y) * worldPerPx,
      );

      heroScale = scale;
      heroX = positionX / worldPerPx + size.width / 2;
      heroY = size.height / 2 - positionY / worldPerPx;
    }

    // --- About: розмір за еталоном (як було) ---
    const aboutSizeMul = isMobile ? TUNE.mobileSizeMul : TUNE.aboutSizeMul;
    const aboutScale =
      (TUNE.sizeFrac * REF.height * viewportFit * aboutSizeMul * worldPerPx) /
      geometry.height;

    const about = rectCenter("about");

    let screenX = heroX;
    let screenY = heroY;
    let yaw = heroPose.yaw;
    let pitch = heroPose.pitch;
    let roll = heroPose.roll;
    let scale = heroScale;

    if (isMobile) {
      // Мобайл: спуск СТРОГО по центру через About (фаза 1) → вид згори в геп-зоні (фаза 2).
      const g = clamp01(choreo.droneGap);
      const aboutX = about ? about.x : heroX;
      const aboutY = about ? about.y : heroY;
      const gap = rectCenter("drone-gap");
      const gapX = gap ? gap.x : aboutX;
      const gapY = gap ? gap.y : aboutY;

      screenX = lerp(lerp(heroX, aboutX, p), gapX, g);
      screenY = lerp(lerp(heroY, aboutY, p), gapY, g);
      yaw = lerp(lerp(heroPose.yaw, TUNE.aboutYaw, p), TUNE.gapYaw, g);
      pitch = lerp(lerp(heroPose.pitch, 0, p), TUNE.gapPitch, g);
      roll = lerp(heroPose.roll, 0, p);
      scale = lerp(heroScale, aboutScale, p);
    } else if (about) {
      // Десктоп: Hero-слот → правий-центр боксу About (їде з секцією), −30% розміру.
      screenX = lerp(
        heroX,
        about.rect.left + TUNE.aboutAnchor[0] * about.rect.width,
        p,
      );
      screenY = lerp(
        heroY,
        about.rect.top + TUNE.aboutAnchor[1] * about.rect.height,
        p,
      );
      yaw = lerp(heroPose.yaw, TUNE.aboutYaw, p);
      pitch = lerp(heroPose.pitch, 0, p);
      roll = lerp(heroPose.roll, 0, p);
      scale = lerp(heroScale, aboutScale, p);
    }

    /* Плавне «допливання»: рендеримо не сиру ціль скролу, а згладжений стан, що доганяє її
       з інерцією (кадронезалежно). Дає преміальний рух, не прибитий до позиції скролу.
       Перший кадр — снап без глайду (щоб не «прилітав» з нуля). */
    if (!smooth.current) {
      smooth.current = { x: screenX, y: screenY, scale, yaw, pitch, roll };
    }
    const s = smooth.current;
    s.x = damp(s.x, screenX, TUNE.glide, delta);
    s.y = damp(s.y, screenY, TUNE.glide, delta);
    s.scale = damp(s.scale, scale, TUNE.glide, delta);
    s.yaw = damp(s.yaw, yaw, TUNE.glide, delta);
    s.pitch = damp(s.pitch, pitch, TUNE.glide, delta);
    s.roll = damp(s.roll, roll, TUNE.glide, delta);

    /* Стеження за курсором — на ЗГЛАДЖЕНУ позу, лише в Hero (згасає при вильоті). Крен
       протилежний до повороту — так апарат «закладає віраж», а не просто крутиться. */
    const aimInfluence = 1 - p;
    const finalYaw = s.yaw + aimed.current.x * TUNE.pointerAim.yaw * aimInfluence;
    const finalPitch =
      s.pitch + aimed.current.y * TUNE.pointerAim.pitch * aimInfluence;
    const finalRoll =
      s.roll - aimed.current.x * TUNE.pointerAim.roll * aimInfluence;

    group.position.set(
      (s.x - size.width / 2) * worldPerPx,
      (size.height / 2 - s.y) * worldPerPx,
      0,
    );
    group.scale.setScalar(s.scale);

    // Порядок "ZXY": yaw навколо власної вертикалі → нахил до камери → оберт у площині екрана.
    inner.rotation.set(finalPitch, finalYaw, finalRoll, "ZXY");
    inner.position.y =
      Math.sin(state.clock.elapsedTime * TUNE.hover.speed) *
      TUNE.hover.amplitude;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={model}>
        <primitive
          object={scene}
          position={[-geometry.pivot.x, -geometry.pivot.y, -geometry.pivot.z]}
        />
      </group>
    </group>
  );
};

export default DroneModel;
