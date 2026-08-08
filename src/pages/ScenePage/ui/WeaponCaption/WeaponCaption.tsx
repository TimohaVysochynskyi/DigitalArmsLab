import type { Weapon } from "@/features/arsenal";

import css from "./WeaponCaption.module.css";

type WeaponCaptionProps = {
  className?: string;
  weapon: Weapon;
};

const WeaponCaption = ({
  className = "",
  weapon: { name, country, year },
}: WeaponCaptionProps) => {
  return (
    <div className={`${css.caption} ${className}`}>
      <h1 className={css.title}>{name}</h1>
      <p className={css.meta}>
        {country}
        <br />
        {year}
      </p>
    </div>
  );
};

export default WeaponCaption;
