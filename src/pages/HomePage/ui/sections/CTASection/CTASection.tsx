import VisionScanner from "@/shared/VisionScanner";
import CTAButton from "@/shared/CTAButton";

import css from "./CTASection.module.css";

const CTASection = () => {
  return (
    <>
      <section id="cta" className={css.sectionWrapper}>
        <VisionScanner />
        <div className={css.section}>
          {/* Слот під 3D-АКМ (замість картинки akms-2). Габарити = аспект akms-2.png. */}
          <div id="akm-slot-cta" className={css.akmSlot} aria-hidden="true" />
          <CTAButton>дізнатись більше</CTAButton>
        </div>
      </section>
    </>
  );
};

export default CTASection;
