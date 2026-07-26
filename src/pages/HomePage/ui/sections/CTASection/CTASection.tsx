import VisionScanner from "@/shared/VisionScanner";
import CTAButton from "@/shared/CTAButton";

import css from "./CTASection.module.css";

import akmsImage from "@/assets/images/akms-2.png";

const CTASection = () => {
  return (
    <>
      <section className={css.sectionWrapper}>
        <VisionScanner />
        <div className={css.section}>
          <img src={akmsImage} alt="АКМС" className={css.akmsImage} />
          <CTAButton>дізнатись більше</CTAButton>
        </div>
      </section>
    </>
  );
};

export default CTASection;
