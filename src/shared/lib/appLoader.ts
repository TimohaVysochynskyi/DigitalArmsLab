/* Єдиний стартовий лоадер.

   Оверлей `#app-loader` живе в index.html і показується з ПЕРШОГО байта HTML — ще до
   завантаження й розбору JS. Тому немає «рваного» переходу між лоадером Suspense і лоадером
   сцени: це один і той самий шар увесь час, поки готується сторінка.

   React лише ХОВАЄ його, коли контент справді готовий:
     - на сторінках із 3D — щойно моделі завантажені (сайт відкривається вже зі сценою, а не
       порожнім кадром);
     - на решті — одразу після монтування.
   Виклик ідемпотентний (спрацьовує один раз). */

let hidden = false;

export const hideAppLoader = () => {
  if (hidden) return;
  hidden = true;

  const el = document.getElementById("app-loader");
  if (!el) return;

  el.classList.add("app-loader--hidden");
  const remove = () => el.remove();
  // Прибираємо після згасання; таймер — страховка, якщо transitionend не прийде.
  el.addEventListener("transitionend", remove, { once: true });
  window.setTimeout(remove, 700);
};
