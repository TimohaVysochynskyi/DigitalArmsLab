/* Інтерактивна сцена однієї одиниці: власний <Canvas> (на відміну від глобального
   shared/Scene3D, тут потрібні події миші), спільне студійне світло, орбіта та кліпи. */

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { StudioEnvironment } from "@/shared/Scene3D";
import Loader from "@/shared/Loader";
import WeaponModel from "./WeaponModel";
import ViewControls from "./ViewControls";
import { CAMERA_FOV } from "./viewer.config";
import css from "./WeaponViewer.module.css";

type WeaponViewerProps = {
  className?: string;
  modelUrl: string;
  isDisassembled: boolean;
  autoRotate: boolean;
  resetSignal: number;
  onAssemblyAvailable: (isAvailable: boolean) => void;
  /** Ручне втручання користувача — привід зупинити автообертання. */
  onUserInteract: () => void;
};

const WeaponViewer = ({
  className = "",
  modelUrl,
  isDisassembled,
  autoRotate,
  resetSignal,
  onAssemblyAvailable,
  onUserInteract,
}: WeaponViewerProps) => {
  const { active } = useProgress();

  return (
    <div
      className={`${css.viewer} ${className}`}
      onPointerDown={onUserInteract}
    >
      <Canvas
        className={css.canvas}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: CAMERA_FOV, near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.15;
        }}
      >
        <Suspense fallback={null}>
          <StudioEnvironment />
          <WeaponModel
            url={modelUrl}
            isDisassembled={isDisassembled}
            onAssemblyAvailable={onAssemblyAvailable}
          />
        </Suspense>

        <ViewControls autoRotate={autoRotate} resetSignal={resetSignal} />
      </Canvas>

      {active && (
        <div className={css.loading}>
          <Loader />
        </div>
      )}
    </div>
  );
};

export default WeaponViewer;
