/* Збирає 3D-шар HomePage: overlay-Canvas (shared/Scene3D) + моделі.

   Шар монтується ОДРАЗУ (не чекає useIdle): екран усе одно перекриває стартовий лоадер
   (#app-loader), поки вантажиться сцена, тож 3D має завантажитись якнайшвидше — сайт
   відкривається вже зі сценою. Обидві моделі монтуються РАЗОМ: після переходу на KTX2 вони
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

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight } from "three";
import Scene3D from "@/shared/Scene3D";
import DroneModel from "./DroneModel";
import AkmModel from "./AkmModel";
import { useSceneActivity } from "./useSceneActivity";
import { useHomeChoreography } from "./useHomeChoreography";
import { clamp01, lerp, smoothstep } from "./math";
import type { Choreo } from "./types";

/** Секція, з появою якої 3D остаточно виходить із кадру. */
const SCENE_END_SECTION_ID = "contact";

/* Фронтальне світло для CTA. За прогресом переходу (choreo.akmFlow 0→1) воно ЗМІЩАЄТЬСЯ
   НАПЕРЕД (до камери) і яскравішає, тож розібрана зброя освітлюється спереду, а не лишається
   в затінку рим-світла. У Features (flow 0) — згасле, тож дрона й зібраний АКМ не чіпає. */
const CtaFrontLight = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const light = useRef<DirectionalLight>(null);

  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const flow = smoothstep(clamp01(choreoRef.current.akmFlow));
    // Помаранчеве світло менш «люмінозне» за біле, тож інтенсивність трохи вища.
    l.intensity = flow * 3.8;
    // Напрямок світла зсувається наперед (z до глядача) — фронтальніше освітлення.
    l.position.set(0, 1.5, lerp(2, 9, flow));
  });

  // Тепле помаранчеве (той самий брендовий тон, що й рим-світло) — премій-вигляд під стиль.
  return <directionalLight ref={light} intensity={0} color="#ff8a4c" />;
};

/* Сигнал готовності 3D. Цей компонент — сусід моделей під ТИМ САМИМ Suspense у Scene3D, тож
   його useEffect спрацьовує саме тоді, коли обидві моделі завантажені й ось-ось намалюються.
   Тоді ховаємо стартовий лоадер — сайт відкривається ВЖЕ зі сценою, а не порожнім кадром.
   Чекаємо ще пару кадрів, щоб сцена справді встигла намалюватись до відкриття. */
const SceneReady = ({ onReady }: { onReady: () => void }) => {
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [onReady]);

  return null;
};

type HomeSceneProps = {
  choreoRef: RefObject<Choreo>;
  /** Активний крок картки Features — його показує вже сама секція. */
  onFeaturesStep: (step: number) => void;
  /** Викликається, коли моделі завантажені (щоб приховати стартовий лоадер). */
  onReady: () => void;
};

const HomeScene = ({ choreoRef, onFeaturesStep, onReady }: HomeSceneProps) => {
  const active = useSceneActivity(SCENE_END_SECTION_ID);

  useHomeChoreography(choreoRef, onFeaturesStep);

  return (
    <Scene3D active={active}>
      <DroneModel choreoRef={choreoRef} />
      <AkmModel choreoRef={choreoRef} />
      <CtaFrontLight choreoRef={choreoRef} />
      <SceneReady onReady={onReady} />
    </Scene3D>
  );
};

export default HomeScene;
