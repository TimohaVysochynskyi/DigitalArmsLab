/* «Сторінку вже видно — можна братися за решту».

   Усе, що не потрібне для першого екрана (фонове відео, 3D-шар), змагається за ту саму
   мережу й той самий головний потік, що й розмітка з текстом. На повільному з'єднанні це
   прямо відсуває момент, коли користувач бачить заголовок.

   Хук віддає false, доки браузер зайнятий критичною роботою, і true — щойно звільнився.
   Таймаут потрібен як страховка: на дуже завантаженій сторінці простою може не бути
   взагалі, і чекати вічно не можна. */

import { useEffect, useState } from "react";

export const useIdle = (timeout = 2000) => {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    // requestIdleCallback є не в усіх браузерах (Safari) — там просто чекаємо кадру.
    const request = window.requestIdleCallback;
    if (!request) {
      const frame = requestAnimationFrame(() => setIdle(true));

      return () => cancelAnimationFrame(frame);
    }

    const handle = request(() => setIdle(true), { timeout });

    return () => window.cancelIdleCallback?.(handle);
  }, [timeout]);

  return idle;
};
