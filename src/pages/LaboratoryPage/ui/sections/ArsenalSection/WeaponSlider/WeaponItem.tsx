import { memo } from "react";

import type { Weapon } from "@/features/arsenal";

import css from "./WeaponSlider.module.css";

type Props = {
  weapon: Weapon;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
};

const WeaponItem = ({
  weapon: { name, country, year, image },
  index,
  isActive,
  onSelect,
}: Props) => {
  return (
    <>
      <button
        type="button"
        className={`${css.slide} ${isActive ? "" : css.slideInactive}`}
        onClick={() => onSelect(index)}
        aria-current={isActive}
        tabIndex={isActive ? 0 : -1}
      >
        <img src={image} alt={name} className={css.weaponImage} />
        <div className={css.weaponDescription}>
          <p className={css.weaponTitle}>{name}</p>
          <p className={css.weaponSubtitle}>
            {country}
            <br />
            {year}
          </p>
        </div>
      </button>
    </>
  );
};

export default memo(WeaponItem);
