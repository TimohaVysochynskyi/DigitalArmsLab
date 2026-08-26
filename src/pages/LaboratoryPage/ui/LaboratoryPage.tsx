import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useArsenal } from "@/features/arsenal";
import { hideAppLoader } from "@/shared/lib/appLoader";
import { readWeaponState } from "@/shared/lib";

import GuideSection from "./sections/GuideSection";
import ArsenalSection from "./sections/ArsenalSection";
import { useArsenalSlider } from "./sections/ArsenalSection/useArsenalSlider";

import css from "./LaboratoryPage.module.css";

const LaboratoryPage = () => {
  // Немає важкого 3D → відкриваємо сторінку одразу (ховаємо стартовий лоадер).
  useEffect(() => {
    hideAppLoader();
  }, []);

  /* Стан слайдера живе тут: гід озвучує ту саму зброю, що вибрана в арсеналі.
     Перехід зі сцени приносить у state одиницю, на якій треба відкрити слайдер. */
  const { state } = useLocation();
  const { data, isLoading, error } = useArsenal();
  const slider = useArsenalSlider(data, readWeaponState(state));

  return (
    <>
      <div className={css.container}>
        <section className={css.guideWrapper}>
          <GuideSection weapon={slider.activeWeapon} />
        </section>
        <section className={css.arsenalWrapper}>
          <ArsenalSection
            data={data}
            isLoading={isLoading}
            error={error}
            slider={slider}
          />
        </section>
        <div className={css.bgEffect} />
      </div>
    </>
  );
};

export default LaboratoryPage;
