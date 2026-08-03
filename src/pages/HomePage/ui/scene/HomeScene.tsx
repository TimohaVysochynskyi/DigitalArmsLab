/* Збирає 3D-шар HomePage: overlay-Canvas (shared/Scene3D) + моделі. */

import type { RefObject } from "react";
import Scene3D from "@/shared/Scene3D";
import DroneModel from "./DroneModel";
import AkmModel from "./AkmModel";
import type { Choreo } from "./types";

const HomeScene = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  return (
    <Scene3D>
      <DroneModel choreoRef={choreoRef} />
      <AkmModel choreoRef={choreoRef} />
    </Scene3D>
  );
};

export default HomeScene;
