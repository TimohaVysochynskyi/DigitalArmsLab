import css from "./FeaturesSection.module.css";

import akmsImage from "@/assets/images/akms.png";

const FeaturesSection = () => {
  return (
    <>
      <section className={css.sectionWrapper}>
        <div className={css.section}>
          <div className={css.imageWrapper}>
            <img src={akmsImage} alt="АКМС" className={css.akmsImage} />
          </div>
          <div className={css.card}>
            <div className={css.cardHeader}>
              <span className={css.cardNumber}>01</span>
              <h2 className={css.cardTitle}>Інтерактивні 3D-моделі зброї</h2>
            </div>
            <p className={css.cardText}>
              &nbsp;&nbsp;У DigitalArmsLab ти можеш детально вивчати зброю у
              тривимірному просторі. Кожна модель ретельно відтворена з
              урахуванням реальних характеристик. Досліджуй зброю з усіх
              ракурсів, змінюй режими огляду та порівнюй радянські та натівські
              аналоги.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;
