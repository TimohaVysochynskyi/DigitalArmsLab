/* Збирає 3D-шар HomePage: overlay-Canvas (shared/Scene3D) + моделі.

   Весь шар монтується вже після першого екрана (useIdle у HomePage), тож на Hero він
   мережу й потік не забирає. Обидві моделі монтуються РАЗОМ: після переходу на KTX2 вони
   легкі (drone 1.2 МБ + akm 1.9 МБ), а щойно вони завантажені, Scene3D у простої прогріває
   їхні шейдери й текстури (SceneWarmup). Тому колишнє відкладене підвантаження АКМ «під час
   наближення» більше не потрібне — воно лише переносило лаг компіляції на момент появи
   моделі у Features; тепер до цього моменту все вже прогріте.

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
import { useSceneActivity } from "./useSceneActivity";
import { useHomeChoreography } from "./useHomeChoreography";
import type { Choreo } from "./types";

/** Секція, з появою якої 3D остаточно виходить із кадру. */
const SCENE_END_SECTION_ID = "contact";

type HomeSceneProps = {
  choreoRef: RefObject<Choreo>;
  /** Активний крок картки Features — його показує вже сама секція. */
  onFeaturesStep: (step: number) => void;
};

const HomeScene = ({ choreoRef, onFeaturesStep }: HomeSceneProps) => {
  const active = useSceneActivity(SCENE_END_SECTION_ID);

  useHomeChoreography(choreoRef, onFeaturesStep);

  return (
    <Scene3D active={active}>
      <DroneModel choreoRef={choreoRef} />
      <AkmModel choreoRef={choreoRef} />
    </Scene3D>
  );
};

export default HomeScene;
