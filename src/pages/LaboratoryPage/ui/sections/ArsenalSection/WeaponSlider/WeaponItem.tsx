import { memo, type MouseEvent } from "react";
import { Link } from "react-router-dom";

import type { Weapon } from "@/features/arsenal";

import css from "./WeaponSlider.module.css";

type Props = {
  weapon: Weapon;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
};

/* Картка завжди <a> (а не <a>/<button> залежно від стану): зміна типу елемента
   перемонтовує вузол, і CSS-перехід активної/неактивної картки не встигає програтись.
   Клік по неактивній лише перемикає вибір, перехід на сцену — тільки з активної. */
const WeaponItem = ({
  weapon: { id, name, country, year, image },
  index,
  isActive,
  onSelect,
}: Props) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isActive) return;

    event.preventDefault();
    onSelect(index);
  };

  return (
    <Link
      to={`/lab/${id}`}
      className={`${css.slide} ${isActive ? "" : css.slideInactive}`}
      onClick={handleClick}
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
    </Link>
  );
};

export default memo(WeaponItem);
