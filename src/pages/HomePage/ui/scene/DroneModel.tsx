/* Дрон: без зашитих анімацій. У Hero — по центру в'юпорту, камерою на глядача; при скролі
   «влітає» у праву частину секції About і далі ЇДЕ РАЗОМ з нею (прив'язаний до боксу #about),
   тож не пливе вниз на наступні секції. Легкий процедурний «ховер».

   Тюнити наживо: DRONE_TUNE. rotation навколо власного центра моделі (recenter -base.center);
   якщо оберт виглядає ексцентрично — вистав у Blender Origin to Geometry і переекспортуй. */

import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, Group, PerspectiveCamera } from "three";
import type { Choreo } from "./types";

const MODEL_URL = "/models/drone.glb";
useGLTF.preload(MODEL_URL);

const DRONE_TUNE = {
  // Точка «приземлення» в About (частка боксу секції): правий-центр, урівень з контентом.
  aboutAnchor: [0.72, 0.5] as [number, number],
  // Оберт навколо Y. 0 → модель дивиться праворуч (+X); -PI/2 → на глядача (Hero).
  heroRotY: -Math.PI / 2,
  // About: довертаємо вліво ~40°.
  aboutRotY: -Math.PI / 2 - (Math.PI / 180) * 40,
  // Розмір: частка МЕНШОГО виміру в'юпорту → пропорційно меншає на вузьких екранах.
  sizeFrac: 0.25,
  // На About зменшуємо ще на 10% (щоб не обрізався краєм екрану).
  aboutSizeMul: 0.9,
  hover: { amp: 0.06, speed: 1.1 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const DroneModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const group = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const { camera, size } = useThree();

  const base = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    const sizeV = new Vector3();
    box.getCenter(center);
    box.getSize(sizeV);
    return { center, height: sizeV.y || 1 };
  }, [scene]);

  useFrame((state) => {
    const g = group.current;
    const inr = inner.current;
    if (!g || !inr) return;

    const c = choreoRef.current;
    g.visible = c.droneVisible;
    if (!c.droneVisible) return;

    const p = clamp01(c.droneProgress);

    const cam = camera as PerspectiveCamera;
    const worldPerPx =
      (2 * Math.tan((cam.fov * Math.PI) / 180 / 2) * cam.position.z) /
      size.height;

    // Екранна ціль: центр в'юпорту (Hero) → правий-центр боксу About (їде з секцією).
    let sx = size.width * 0.5;
    let sy = size.height * 0.5;
    const aboutEl = document.getElementById("about");
    if (aboutEl) {
      const r = aboutEl.getBoundingClientRect();
      const aboutX = r.left + DRONE_TUNE.aboutAnchor[0] * r.width;
      const aboutY = r.top + DRONE_TUNE.aboutAnchor[1] * r.height;
      sx = lerp(size.width * 0.5, aboutX, p);
      sy = lerp(size.height * 0.5, aboutY, p);
    }
    // Пряме трекання (позиція вже плавна від scrub-прогресу) — без лагу/тремтіння.
    g.position.set(
      (sx - size.width / 2) * worldPerPx,
      (size.height / 2 - sy) * worldPerPx,
      0,
    );

    // Адаптивний масштаб — за меншим виміром в'юпорту; на About −10%.
    const vmin = Math.min(size.width, size.height);
    const sizeMul = lerp(1, DRONE_TUNE.aboutSizeMul, p);
    g.scale.setScalar(
      (DRONE_TUNE.sizeFrac * sizeMul * vmin * worldPerPx) / base.height,
    );

    // Оберт навколо власного центра + ховер.
    inr.rotation.y = lerp(DRONE_TUNE.heroRotY, DRONE_TUNE.aboutRotY, p);
    inr.position.y =
      Math.sin(state.clock.elapsedTime * DRONE_TUNE.hover.speed) *
      DRONE_TUNE.hover.amp;
  });

  return (
    <group ref={group} visible={false}>
      <group ref={inner}>
        <primitive
          object={scene}
          position={[-base.center.x, -base.center.y, -base.center.z]}
        />
      </group>
    </group>
  );
};

export default DroneModel;
