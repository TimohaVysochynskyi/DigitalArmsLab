import VisionScanner from "@/shared/VisionScanner";
import css from "./AboutSection.module.css";

const AboutSection = () => {
  return (
    <>
      <section className={css.sectionWrapper}>
        <VisionScanner />
        <div className={css.section}>
          <div className={css.content}>
            <h2 className={css.title}>
              <span>Вивчай</span> характеристики,
              <br />
              <span> взаємодій</span> із 3D-моделями та
              <span> досліджуй</span> принципи роботи.
            </h2>

            <div className={css.descriptionWrapper}>
              <span className={css.guide}>[ Голосовий провідник ] </span>
              <p className={css.description}>
                Український військовий – допоможе краще зрозуміти особливості
                кожної одиниці зброї.
              </p>
              <div className={css.buttonWrapper}>
                <svg
                  className={css.buttonIcon}
                  viewBox="0 0 17 78"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1.00003 17.6667L1 1L16.8167 1" strokeWidth="2" />
                  <path d="M1 17.6667V77L16.8167 77" strokeWidth="2" />
                </svg>

                <button type="button" className={css.button}>
                  спробуй голосового провідника
                  <svg
                    className={css.arrowIcon}
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12.0788 7.5H0V6.5H12.0788L6.2865 0.70775L7 0L14 7L7 14L6.2865 13.2923L12.0788 7.5Z" />
                  </svg>
                </button>

                <svg
                  className={css.buttonIcon}
                  viewBox="0 0 17 78"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.8164 17V77L-0.000247732 77" strokeWidth="2" />
                  <path
                    d="M15.8164 17.6667L15.8164 1L-0.000247732 1"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
