import WeaponItem from "./WeaponItem";
import type { ArsenalSlider } from "../useArsenalSlider";

import css from "./WeaponSlider.module.css";

type WeaponSliderProps = {
  slider: ArsenalSlider;
};

const WeaponSlider = ({ slider }: WeaponSliderProps) => {
  const {
    slides,
    activeSlideIndex,
    offset,
    isAnimated,
    trackRef,
    prev,
    next,
    selectSlide,
    handleTransitionEnd,
  } = slider;

  return (
    <>
      <div className={css.slider}>
        <button
          type="button"
          className={css.arrowButton}
          onClick={prev}
          aria-label="Попередня зброя"
        >
          <svg
            className={css.arrow}
            viewBox="0 0 8 13"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7.1195 13L0 6.5L7.1195 0L8 0.815371L1.77358 6.5L8 12.1846L7.1195 13Z" />
          </svg>
        </button>

        <div className={css.viewport}>
          <div
            ref={trackRef}
            className={`${css.track} ${isAnimated ? css.trackAnimated : ""}`}
            style={{ transform: `translate3d(${-offset}px, 0, 0)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((weapon, index) => (
              <WeaponItem
                key={`${weapon.id}-${index}`}
                weapon={weapon}
                index={index}
                isActive={index === activeSlideIndex}
                onSelect={selectSlide}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={css.arrowButton}
          onClick={next}
          aria-label="Наступна зброя"
        >
          <svg
            className={css.arrow}
            viewBox="0 0 8 13"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0.880503 13L8 6.5L0.880503 0L0 0.815371L6.22642 6.5L0 12.1846L0.880503 13Z" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default WeaponSlider;
