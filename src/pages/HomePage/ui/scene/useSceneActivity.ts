/* Чи треба зараз малювати 3D.

   Єдина відповідальність хука — саме це рішення; що з ним робити, вирішує Scene3D.

   Навіщо. Канвас малює 60 кадрів на секунду постійно, зокрема й у Contacts, де 3D немає
   взагалі. На десктопі це просто марна робота, на телефоні — витрачена батарея й нагрів,
   через який пристрій сам знижує частоту і сайт починає лагати вже скрізь.

   Де саме вимикати. Момент вибрано так, щоб на екрані в цю мить уже НІЧОГО не малювалось:
   зупинений рендер лишає на канвасі останній кадр, і якби ми вимикались раніше, модель
   застигла б поверх сторінки. Тому межа — коли секція-кінець (Contacts) дійшла до верху
   в'юпорта: до цієї миті і дрон, і АКМ давно поза кадром.

   Реалізація через IntersectionObserver, а не слухач скролу: жодних читань layout і
   жодної роботи на кожен піксель прокрутки — браузер сам повідомляє про перетин межі. */

import { useEffect, useState } from "react";

export const useSceneActivity = (endSectionId: string) => {
  const [visible, setVisible] = useState(true);
  const [tabActive, setTabActive] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );

  useEffect(() => {
    const element = document.getElementById(endSectionId);
    if (!element) return;

    /* Стискаємо нижній край root'а майже на всю висоту в'юпорта — лишається вузька смуга
       вздовж його верхньої межі. Перетин із нею означає «секція дійшла до верху екрана»,
       а отже 3D повністю пішло з кадру.
       Рівно −100% брати не можна: смуга стає нульової висоти, площа перетину — нуль,
       і IntersectionObserver не рахує це за перетин узагалі. */
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px 0px -98% 0px" },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [endSectionId]);

  useEffect(() => {
    const onVisibility = () => setTabActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible && tabActive;
};
