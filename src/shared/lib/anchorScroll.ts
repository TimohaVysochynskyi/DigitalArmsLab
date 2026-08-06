/* react-router перехоплює клік по <a href="#id"> і робить history.push — нативного
   переходу до фрагмента не відбувається. Тому скролимо самі. */

export const ANCHOR_STATE_KEY = "anchor";

export const isAnchor = (to: string) => to.startsWith("#");

const headerOffset = () =>
  document.querySelector("header")?.getBoundingClientRect().height ?? 0;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollNow = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return false;

  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
  return true;
};

const MAX_FRAMES = 60;

/** Стартує з наступного кадру (чекає побічних ефектів кліку) і чекає появи цілі в DOM. */
export const scrollToAnchor = (to: string, frames = MAX_FRAMES) => {
  const id = to.replace(/^#/, "");
  if (!id) return;

  requestAnimationFrame(() => {
    if (scrollNow(id) || frames <= 1) return;
    scrollToAnchor(to, frames - 1);
  });
};
