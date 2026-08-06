import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type TransitionEvent,
} from "react";

import type { ArsenalData, Weapon, WeaponCategoryId } from "@/features/arsenal";

const COPIES = 3;

const NO_WEAPONS: Weapon[] = [];

export type ArsenalSlider = {
  slides: Weapon[];
  activeSlideIndex: number;
  activeCategoryId: WeaponCategoryId;
  offset: number;
  isAnimated: boolean;
  trackRef: RefObject<HTMLDivElement | null>;
  prev: () => void;
  next: () => void;
  selectSlide: (slideIndex: number) => void;
  goToCategory: (categoryId: WeaponCategoryId) => void;
  handleTransitionEnd: (event: TransitionEvent<HTMLDivElement>) => void;
};

const wrap = (value: number, length: number) =>
  length ? ((value % length) + length) % length : 0;

const readVisibleSlides = (element: HTMLElement) => {
  const value = Number.parseInt(
    getComputedStyle(element).getPropertyValue("--visible-slides"),
    10,
  );

  return Number.isFinite(value) && value > 0 ? value : 1;
};

export const useArsenalSlider = (data: ArsenalData | null): ArsenalSlider => {
  const weapons = data?.weapons ?? NO_WEAPONS;
  const total = weapons.length;

  const trackRef = useRef<HTMLDivElement>(null);

  // Індекс лівої видимої картки в slides. Виходить за межі списку — це і є безкінечність.
  const [position, setPosition] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isAnimated, setIsAnimated] = useState(true);

  const slides = useMemo(
    () => Array.from({ length: COPIES }, () => weapons).flat(),
    [weapons],
  );

  const activeCategoryId = weapons[wrap(position, total)]?.categoryId ?? "";

  useEffect(() => {
    if (!total) return;

    setIsAnimated(false);
    setPosition(total);
    setActiveSlideIndex(total);
  }, [total]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const viewport = track?.parentElement;
    if (!track || !viewport || !total) return;

    const measure = () => {
      setVisibleSlides(readVisibleSlides(viewport));

      const slide = track.children[position];
      if (slide) setOffset((slide as HTMLElement).offsetLeft);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);

    return () => observer.disconnect();
  }, [position, total]);

  // Повернення в середню копію: анімація вимикається, щоб стрибок був непомітний.
  const rebase = useCallback(
    (from: number) => {
      const target = total + wrap(from, total);
      if (target === from) return;

      setIsAnimated(false);
      setPosition(target);
      setActiveSlideIndex((current) => current + (target - from));
    },
    [total],
  );

  // Перервана анімація не віддає transitionend — страхуємось від дрейфу позиції.
  useEffect(() => {
    if (!total) return;
    if (position >= 0 && position < COPIES * total) return;

    rebase(position);
  }, [position, total, rebase]);

  useEffect(() => {
    if (isAnimated) return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setIsAnimated(true));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isAnimated]);

  const goTo = useCallback((nextPosition: number) => {
    setPosition(nextPosition);
    setActiveSlideIndex(nextPosition);
  }, []);

  /* Стрілка рухає вибір на одну картку. Трек зсувається на сторінку лише тоді,
     коли вибір вийшов за межі видимого вікна. */
  const step = useCallback(
    (delta: number) => {
      if (!total) return;

      const nextActive = activeSlideIndex + delta;

      let nextPosition = position;
      if (nextActive < position) nextPosition = position - visibleSlides;
      else if (nextActive >= position + visibleSlides)
        nextPosition = position + visibleSlides;

      if (nextActive < nextPosition || nextActive >= nextPosition + visibleSlides) {
        nextPosition = nextActive;
      }

      setActiveSlideIndex(nextActive);
      setPosition(nextPosition);
    },
    [total, activeSlideIndex, position, visibleSlides],
  );

  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const goToCategory = useCallback(
    (categoryId: WeaponCategoryId) => {
      const target = weapons.findIndex((weapon) => weapon.categoryId === categoryId);
      if (target < 0) return;

      // Найкоротший шлях по колу.
      let delta = target - wrap(position, total);
      if (delta > total / 2) delta -= total;
      if (delta < -total / 2) delta += total;

      goTo(position + delta);
    },
    [weapons, position, total, goTo],
  );

  const selectSlide = useCallback(
    (slideIndex: number) => setActiveSlideIndex(slideIndex),
    [],
  );

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
      if (!total) return;
      if (position >= total && position < 2 * total) return;

      rebase(position);
    },
    [total, position, rebase],
  );

  return {
    slides,
    activeSlideIndex,
    activeCategoryId,
    offset,
    isAnimated,
    trackRef,
    prev,
    next,
    selectSlide,
    goToCategory,
    handleTransitionEnd,
  };
};
