/* Дрон (без зашитих анімацій). У Hero — по центру в'юпорту, камерою на глядача.
   Десктоп (>600): при скролі «влітає» у праву частину About і їде РАЗОМ з нею (choreo.droneProgress),
   −30% розміру. Мобайл (≤600): спускається СТРОГО по центру через About (фаза 1, droneProgress),
   потім довертається у вид ЗГОРИ (top-down) у окремій геп-зоні `#drone-gap` між About і Features
   (фаза 2, choreo.droneGap); сталий скейл, ×1.5 більший. + легкий «ховер».

   rotation навколо власного центра моделі (recenter -pivot); якщо оберт ексцентричний —
   у Blender: Object → Set Origin → Origin to Geometry, переекспорт. */

import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, Group, PerspectiveCamera } from "three";
import type { Choreo } from "./types";
import { clamp01, lerp } from "./math";

const MODEL_URL = "/models/drone.opt.glb";
useGLTF.preload(MODEL_URL);

// Еталонний кадр, під який підібрано вигляд (як у ScenePage). Розмір моделі = розмір на
// еталоні × коефіцієнт вписування min(1, w/1920, h/1080): на 1920×1080 як задизайнено,
// нижче — плавно меншає за меншим виміром, зберігаючи пропорцію (не залежить від висоти).
const REF = { width: 1920, height: 1080 };

const TUNE = {
  // Точка приземлення в About (частка боксу секції): правий-центр, урівень з контентом.
  aboutAnchor: [0.72, 0.5] as [number, number],
  // Оберт навколо Y: -PI/2 → дивиться на глядача (Hero); в About довертаємо вліво ~40°.
  heroYaw: -Math.PI / 2,
  aboutYaw: -Math.PI / 2 - (Math.PI / 180) * 40,
  // Висота моделі як частка висоти еталона (1080) у Hero; в About — на 30% менша (десктоп).
  sizeFrac: 0.25,
  aboutSizeMul: 0.7,
  hover: { amplitude: 0.06, speed: 1.1 },
  // --- Мобайл (≤600) ---
  mobileMaxWidth: 600,
  mobileSizeMul: 1.5, // ×1.5 більший на мобайлі
  gapPitch: Math.PI / 2, // 90° — верхом до нас (вид згори) у геп-зоні
  gapYaw: -Math.PI / 2 - Math.PI, // крутимо ВЛІВО далі до ~180° від Hero (єдиний розворот, без реверсу назад)
};

const DroneModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const root = useRef<Group>(null);
  const model = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const { camera, size } = useThree();

  const geometry = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const pivot = box.getCenter(new Vector3());
    const height = box.getSize(new Vector3()).y || 1;
    return { pivot, height };
  }, [scene]);

  useFrame((state) => {
    const group = root.current;
    const inner = model.current;
    if (!group || !inner) return;

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

    const heroX = size.width * 0.5;
    const heroY = size.height * 0.5;
    const aboutRect = document
      .getElementById("about")
      ?.getBoundingClientRect();

    // Екранна ціль + орієнтація + множники розміру (за замовчуванням — Hero-поза).
    let screenX = heroX;
    let screenY = heroY;
    let yaw = TUNE.heroYaw;
    let pitch = 0;
    let sizeMul = 1; // редукція розміру при польоті (лише десктоп −30%)
    let mobileMul = 1;

    if (size.width <= TUNE.mobileMaxWidth) {
      // Мобайл: спуск СТРОГО по центру через About (фаза 1) → вид згори в геп-зоні (фаза 2).
      const g = clamp01(choreo.droneGap);
      const aboutX = aboutRect ? aboutRect.left + 0.5 * aboutRect.width : heroX;
      const aboutY = aboutRect ? aboutRect.top + 0.5 * aboutRect.height : heroY;
      const gapRect = document
        .getElementById("drone-gap")
        ?.getBoundingClientRect();
      const gapX = gapRect ? gapRect.left + 0.5 * gapRect.width : aboutX;
      const gapY = gapRect ? gapRect.top + 0.5 * gapRect.height : aboutY;

      screenX = lerp(lerp(heroX, aboutX, p), gapX, g);
      screenY = lerp(lerp(heroY, aboutY, p), gapY, g);
      yaw = lerp(lerp(TUNE.heroYaw, TUNE.aboutYaw, p), TUNE.gapYaw, g);
      pitch = lerp(0, TUNE.gapPitch, g);
      mobileMul = TUNE.mobileSizeMul; // сталий скейл, просто ×1.5
    } else if (aboutRect) {
      // Десктоп: Hero-центр → правий-центр боксу About (їде з секцією), −30% розміру.
      screenX = lerp(
        heroX,
        aboutRect.left + TUNE.aboutAnchor[0] * aboutRect.width,
        p,
      );
      screenY = lerp(
        heroY,
        aboutRect.top + TUNE.aboutAnchor[1] * aboutRect.height,
        p,
      );
      yaw = lerp(TUNE.heroYaw, TUNE.aboutYaw, p);
      sizeMul = lerp(1, TUNE.aboutSizeMul, p);
    }

    group.position.set(
      (screenX - size.width / 2) * worldPerPx,
      (size.height / 2 - screenY) * worldPerPx,
      0,
    );

    // Розмір під еталон × коефіцієнт вписування × мобільний множник.
    const targetPx = TUNE.sizeFrac * REF.height * viewportFit * mobileMul;
    group.scale.setScalar((targetPx * sizeMul * worldPerPx) / geometry.height);

    // Орієнтація (нахил top-down на мобайлі) + легкий вертикальний «ховер».
    inner.rotation.set(pitch, yaw, 0);
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
