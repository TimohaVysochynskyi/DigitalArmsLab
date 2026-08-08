/* Переюзний контейнер для 3D: єдиний fixed-overlay <Canvas> на всю сторінку.

   Z-шар (контракт, back → front):
     фонове медіа секцій (напр. hero <video>)  z-index: -2 і нижче
     ЦЕЙ канвас                                 z-index: -1
     VisionScanner (ефект курсора)              z-index: 0
     контент/текст секцій                       z-index: 1 і вище
   Секції-хости не мають створювати stacking context (без transform / opacity<1 /
   isolation / filter), інакше шарування зламається.

   Освітлення — спільний StudioEnvironment. Канвас прозорий (alpha) і pointer-events:none. */

import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import StudioEnvironment from "./StudioEnvironment";
import css from "./Scene3D.module.css";

type Scene3DProps = {
  children?: ReactNode;
};

const Scene3D = ({ children }: Scene3DProps) => {
  return (
    <div className={css.layer} aria-hidden="true">
      <Canvas
        className={css.canvas}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.15; // легке підняття яскравості
        }}
      >
        <Suspense fallback={null}>
          <StudioEnvironment />
          {children}
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default Scene3D;
