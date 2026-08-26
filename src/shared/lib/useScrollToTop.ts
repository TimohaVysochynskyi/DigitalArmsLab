import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

import { ANCHOR_STATE_KEY } from "./anchorScroll";

/* SPA-перехід не чіпає позицію скролу: браузер лишає ту, що була на попередній сторінці.
   На довгій Лабораторії це помітно — зі слайдера зброї користувач потрапляв на сцену вже
   прокрученим униз. Тому на кожен новий перехід повертаємо сторінку на початок.

   Два винятки:
     POP (кнопки «назад/вперед») — там позицію відновлює сам браузер;
     перехід із якорем — його доскролює useAnchorScroll.

   Монтується один раз — у Layout. */
export const useScrollToTop = () => {
  const { pathname, state } = useLocation();
  const navigationType = useNavigationType();

  const anchor = (state as Record<string, unknown> | null)?.[ANCHOR_STATE_KEY];

  useLayoutEffect(() => {
    if (navigationType === "POP" || typeof anchor === "string") return;

    window.scrollTo(0, 0);
  }, [pathname, navigationType, anchor]);
};

export default useScrollToTop;
