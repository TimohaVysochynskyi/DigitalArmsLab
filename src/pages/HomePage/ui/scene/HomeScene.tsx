/* Збирає 3D-шар HomePage: overlay-Canvas (shared/Scene3D) + моделі.

   Моделі монтуються не разом: на першому екрані потрібен лише дрон, і АКМ, змонтований
   одразу, забирав би в нього мережу та головний потік саме тоді, коли глядач дивиться на
   Hero. АКМ під'їжджає, коли користувач наближається до Features.

   Рендер зупиняється, щойно 3D виходить за межі кадру (Contacts) або вкладку сховано —
   решту сторінки немає сенсу оплачувати шістдесятьма кадрами на секунду.

   Скрол-хореографія живе тут, а не в HomePage, з двох причин. По суті вона існує заради
   3D — керує позами й перельотами моделей. А практично: вона тягне GSAP, і поки виклик
   стояв у HomePage, GSAP потрапляв у чанк першого екрана й затримував появу заголовка,
   хоч тексту не потрібен. Крок картки Features хореографія віддає нагору колбеком. */

import type { RefObject } from "react";
import Scene3D from "@/shared/Scene3D";
import DroneModel from "./DroneModel";
import AkmModel from "./AkmModel";
import { useApproaching } from "./useApproaching";
import { useSceneActivity } from "./useSceneActivity";
import { useHomeChoreography } from "./useHomeChoreography";
import type { Choreo } from "./types";

/** Секція, до якої прив'язана поява АКМ (він живе у Features та CTA). */
const AKM_SECTION_ID = "features";
/** Секція, з появою якої 3D остаточно виходить із кадру. */
const SCENE_END_SECTION_ID = "contact";

type HomeSceneProps = {
  choreoRef: RefObject<Choreo>;
  /** Активний крок картки Features — його показує вже сама секція. */
  onFeaturesStep: (step: number) => void;
};

const HomeScene = ({ choreoRef, onFeaturesStep }: HomeSceneProps) => {
  const akmReady = useApproaching(AKM_SECTION_ID);
  const active = useSceneActivity(SCENE_END_SECTION_ID);

  useHomeChoreography(choreoRef, onFeaturesStep);

  return (
    <Scene3D active={active}>
      <DroneModel choreoRef={choreoRef} />
      {akmReady && <AkmModel choreoRef={choreoRef} />}
    </Scene3D>
  );
};

export default HomeScene;
