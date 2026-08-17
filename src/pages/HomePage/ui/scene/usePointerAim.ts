/* Нормалізована позиція курсора для «живих» 3D-реакцій.

   Віддає мутабельний ref (не стан) — рух миші не має спричиняти ре-рендери React;
   читається в useFrame, як і Choreo.

   Значення: x, y у діапазоні −1..1 від центра в'юпорту (x: ліво→право, y: верх→низ).
   Курсор поза вікном або пристрій без миші → 0/0, тобто базова поза без відхилень. */

import { useEffect, useRef } from "react";

export type PointerAim = { x: number; y: number; active: boolean };

/** Тільки миша: на тачі ховера немає, а reduce-motion вимикає зайвий рух свідомо. */
const shouldTrack = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const usePointerAim = () => {
  const aim = useRef<PointerAim>({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!shouldTrack()) return;

    const onMove = (event: PointerEvent) => {
      aim.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      aim.current.y = (event.clientY / window.innerHeight) * 2 - 1;
      aim.current.active = true;
    };

    // Курсор пішов із вікна / вкладка неактивна — плавно повертаємось у базову позу.
    const onRelease = () => {
      aim.current.x = 0;
      aim.current.y = 0;
      aim.current.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onRelease);
    window.addEventListener("blur", onRelease);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onRelease);
      window.removeEventListener("blur", onRelease);
    };
  }, []);

  return aim;
};
