/* Чи наблизився користувач до секції настільки, що її 3D пора готувати.

   Потрібно, щоб важкі моделі не вантажились усі одразу: на першому екрані потрібен лише
   дрон, а АКМ конкурував із ним за мережу, декодування і головний потік — і затримував
   саме те, що глядач бачить першим.

   Повертає true один раз і назавжди: розвантажувати модель назад немає сенсу — повторне
   завантаження коштувало б дорожче, ніж тримати її в пам'яті. */

import { useEffect, useState } from "react";

export const useApproaching = (elementId: string, screensAhead = 1) => {
  const [approaching, setApproaching] = useState(false);

  useEffect(() => {
    if (approaching) return;

    const element = document.getElementById(elementId);
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setApproaching(true);
        observer.disconnect();
      },
      // Розширюємо зону спостереження вниз: спрацьовує ще до появи секції в кадрі,
      // тож модель встигає підвантажитись і скомпілюватись без ривка.
      { rootMargin: `0px 0px ${screensAhead * 100}% 0px` },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [elementId, screensAhead, approaching]);

  return approaching;
};
