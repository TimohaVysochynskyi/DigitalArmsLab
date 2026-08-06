/* Переюзний контейнер для 3D: єдиний fixed-overlay <Canvas> на всю сторінку.

   Z-шар (контракт, back → front):
     фонове медіа секцій (напр. hero <video>)  z-index: -2 і нижче
     ЦЕЙ канвас                                 z-index: -1
     VisionScanner (ефект курсора)              z-index: 0
     контент/текст секцій                       z-index: 1 і вище
   Секції-хости не мають створювати stacking context (без transform / opacity<1 /
   isolation / filter), інакше шарування зламається.

   Освітлення: IBL через <Environment> з Lightformer'ами (без зовнішнього HDRI-файлу) —
   дає відблиски металу АКМ і відображення в камері дрона; + key/fill directional для форми.
   Тюнити наживо: LIGHT_TUNE. Канвас прозорий (alpha) і pointer-events:none. */

import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, Preload } from "@react-three/drei";
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
        {/* М'яке загальне + делікатний теплий key + холодний fill. */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 6]} intensity={1.3} color="#fff4ea" />
        <directionalLight position={[-6, 3, -3]} intensity={0.5} color="#e2ecff" />

        <Suspense fallback={null}>
          {/* Студійне IBL: м'які майже нейтральні площини → делікатні відблиски без кольорового касту. */}
          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={1.4}
              position={[0, 6, 4]}
              scale={[14, 8, 1]}
              rotation={[-Math.PI / 2, 0, 0]}
              color="#ffffff"
            />
            <Lightformer
              form="rect"
              intensity={0.9}
              position={[7, 2, 3]}
              scale={[5, 10, 1]}
              color="#fff3e8"
            />
            <Lightformer
              form="rect"
              intensity={0.9}
              position={[-7, 2, 3]}
              scale={[5, 10, 1]}
              color="#eaf1ff"
            />
            <Lightformer
              form="rect"
              intensity={1.2}
              position={[0, 1, -7]}
              scale={[12, 7, 1]}
              color="#ffffff"
            />
          </Environment>

          {children}
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default Scene3D;
