import { Link, useParams } from "react-router-dom";

import { useWeaponDetail } from "@/features/arsenal";
import Loader from "@/shared/Loader";

import WeaponViewer from "./WeaponViewer";
import SceneToolbar from "./SceneToolbar";
import WeaponCaption from "./WeaponCaption";
import WeaponInfoDrawer from "./WeaponInfoDrawer";
import { useSceneControls } from "./useSceneControls";

import css from "./ScenePage.module.css";

const ScenePage = () => {
  const { weaponId } = useParams();
  const { data: weapon, isLoading, error } = useWeaponDetail(weaponId);
  const controls = useSceneControls(weaponId);

  return (
    <div className={css.page}>
      <div className={css.bgEffect} />
      <div className={css.container}>
        <Link to="/lab" className={css.backLink}>
          <svg
            className={css.backIcon}
            viewBox="0 0 14 14"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1.92125 7.5H14V6.5H1.92125L7.7135 0.70775L7 0L0 7L7 14L7.7135 13.2923L1.92125 7.5Z" />
          </svg>
          Повернутись до Лабораторії
        </Link>

        {isLoading && <Loader />}
        {error && <p className={css.error}>{error}</p>}

        {weapon && (
          <>
            <WeaponViewer
              key={weapon.id}
              className={css.viewer}
              modelUrl={weapon.modelUrl}
              isDisassembled={controls.isDisassembled}
              autoRotate={controls.isAutoRotating}
              resetSignal={controls.resetSignal}
              onAssemblyAvailable={controls.setHasAssembly}
              onUserInteract={controls.stopAutoRotate}
            />

            <div className={css.infoWrapper}>
              <WeaponCaption className={css.caption} weapon={weapon} />

              <SceneToolbar
                className={css.toolbar}
                isInfoOpen={controls.isInfoOpen}
                onToggleInfo={controls.toggleInfo}
                isAutoRotating={controls.isAutoRotating}
                onResetView={controls.resetView}
                hasAssembly={controls.hasAssembly}
                isDisassembled={controls.isDisassembled}
                onToggleAssembly={controls.toggleAssembly}
              />
            </div>
            <WeaponInfoDrawer
              className={css.drawer}
              weapon={weapon}
              isOpen={controls.isInfoOpen}
              onClose={controls.closeInfo}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ScenePage;
