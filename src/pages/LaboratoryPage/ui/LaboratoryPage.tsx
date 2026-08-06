import GuideSection from "./sections/GuideSection";

import css from "./LaboratoryPage.module.css";
import ArsenalSection from "./sections/ArsenalSection";

const LaboratoryPage = () => {
  return (
    <>
      <div className={css.container}>
        <section className={css.guideWrapper}>
          <GuideSection />
        </section>
        <section className={css.arsenalWrapper}>
          <ArsenalSection />
        </section>
      </div>
    </>
  );
};

export default LaboratoryPage;
