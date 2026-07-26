import CTAButton from "@/shared/CTAButton";
import css from "./HeroSection.module.css";

import bgVideo from "@/assets/videos/hero-bg.mp4";

const HeroSection = () => {
  return (
    <>
      <section className={css.heroWrapper}>
        <video
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
          className={css.bgVideo}
        >
          <source src={bgVideo} type="mp4" />
        </video>
        <div className={css.hero}>
          <div className={css.bgGradient} />

          <div className={css.titleWrapper}>
            <h1 className={css.title}>
              <span>[ЛАБОРАТОРІЯ]</span>
              <br /> БЕЗПЕЧНОГО МАЙБУТНЬОГО
            </h1>
            <p className={css.subtitle}>
              Занурся у світ сучасних та історичних зразків озброєння.
            </p>
          </div>

          <CTAButton>розпочати</CTAButton>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
