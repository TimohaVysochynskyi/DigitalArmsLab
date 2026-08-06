/* Дрон (без зашитих анімацій). У Hero — по центру в'юпорту, камерою на глядача; при скролі
   «влітає» у праву частину секції About і далі їде РАЗОМ з нею (прив'язаний до боксу #about),
   тож не пливе вниз на наступні секції. Керується choreo.droneProgress (0→1) + легкий «ховер».

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

const TUNE = {
  // Точка приземлення в About (частка боксу секції): правий-центр, урівень з контентом.
  aboutAnchor: [0.72, 0.5] as [number, number],
  // Оберт навколо Y: -PI/2 → дивиться на глядача (Hero); в About довертаємо вліво ~40°.
  heroYaw: -Math.PI / 2,
  aboutYaw: -Math.PI / 2 - (Math.PI / 180) * 40,
  // Розмір як частка МЕНШОГО виміру в'юпорту (пропорційно меншає на вузьких екранах); −10% в About.
  sizeFrac: 0.25,
  aboutSizeMul: 0.9,
  hover: { amplitude: 0.06, speed: 1.1 },
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

    const progress = clamp01(choreo.droneProgress);
    const camera3d = camera as PerspectiveCamera;
    const worldPerPx =
      (2 * Math.tan((camera3d.fov * Math.PI) / 180 / 2) * camera3d.position.z) /
      size.height;

    // Екранна ціль: центр в'юпорту (Hero) → правий-центр боксу About (їде з секцією).
    let screenX = size.width * 0.5;
    let screenY = size.height * 0.5;
    const about = document.getElementById("about");
    if (about) {
      const rect = about.getBoundingClientRect();
      screenX = lerp(
        size.width * 0.5,
        rect.left + TUNE.aboutAnchor[0] * rect.width,
        progress,
      );
      screenY = lerp(
        size.height * 0.5,
        rect.top + TUNE.aboutAnchor[1] * rect.height,
        progress,
      );
    }
    group.position.set(
      (screenX - size.width / 2) * worldPerPx,
      (size.height / 2 - screenY) * worldPerPx,
      0,
    );

    // Розмір під цільову висоту на екрані.
    const viewportMin = Math.min(size.width, size.height);
    const sizeMul = lerp(1, TUNE.aboutSizeMul, progress);
    group.scale.setScalar(
      (TUNE.sizeFrac * sizeMul * viewportMin * worldPerPx) / geometry.height,
    );

    // Доворот + легкий вертикальний «ховер».
    inner.rotation.y = lerp(TUNE.heroYaw, TUNE.aboutYaw, progress);
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
