import { useEffect } from "react";

import GuideSection from "./sections/GuideSection";

import css from "./LaboratoryPage.module.css";
import ArsenalSection from "./sections/ArsenalSection";
import { hideAppLoader } from "@/shared/lib/appLoader";

const LaboratoryPage = () => {
  // Немає важкого 3D → відкриваємо сторінку одразу (ховаємо стартовий лоадер).
  useEffect(() => {
    hideAppLoader();
  }, []);

  return (
    <>
      <div className={css.container}>
        <section className={css.guideWrapper}>
          <GuideSection />
        </section>
        <section className={css.arsenalWrapper}>
          <ArsenalSection />
        </section>
        <div className={css.bgEffect} />
      </div>
    </>
  );
};

export default LaboratoryPage;
