import CTAButton from "@/shared/CTAButton";
import DeferredVideo from "@/shared/DeferredVideo";
import css from "./HeroSection.module.css";

import bgVideo from "@/assets/videos/hero-bg.mp4";

const HeroSection = () => {
  return (
    <>
      <section id="hero" className={css.heroWrapper}>
        <DeferredVideo src={bgVideo} className={css.bgVideo} />
        {/* Порожній якір для 3D-дрона: задає його позицію та габарит у Hero.
            absolute → на потік не впливає; сам дрон малюється в overlay-канвасі. */}
        <div id="drone-slot-hero" className={css.droneSlot} aria-hidden="true" />

        <div className={css.hero}>
          <div className={css.titleWrapper}>
            <h1 className={css.title}>
              <span className={css.titleMain}>[ЛАБОРАТОРІЯ]</span>
              <span className={css.titleRow1}>БЕЗПЕЧНОГО</span>
              <span className={css.titleRow2}>МАЙБУТНЬОГО</span>
            </h1>
            <p className={css.subtitle}>
              Поринь у світ сучасних та історичних зразків озброєння.
            </p>
          </div>

          <div className={css.bottomWrapper}>
            <CTAButton className={css.button}>розпочати</CTAButton>
            <p className={css.subtitleMobile}>
              Поринь у світ сучасних та історичних зразків озброєння.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
