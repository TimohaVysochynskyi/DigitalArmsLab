import AutoHeight from "@/shared/AutoHeight";

import css from "./FeaturesSection.module.css";

// Контент 3 карток (крок 0/1/2). Синхронізується зі скролом-піном і анімацією АКМ.
const CARDS = [
  {
    title: "Інтерактивні 3D-моделі зброї",
    text: "  У DigitalArmsLab ти можеш детально вивчати зброю у тривимірному просторі. Кожна модель ретельно відтворена з урахуванням реальних характеристик. Досліджуй зброю з усіх ракурсів, змінюй режими огляду та порівнюй радянські та натівські аналоги.",
  },
  {
    title: "Анімація збірки та розбірки",
    text: "  Від теорії – до практики! Наші інтерактивні анімації покажуть покроковий процес розбирання та збирання зброї. Дивись, вивчай та відточуй знання, щоб бути впевненим у своїх навичках.",
  },
  {
    title: "Теоретичний матеріал",
    text: "  Отримуй глибокі знання про кожну одиницю зброї: її конструкцію, технічні характеристики та бойове застосування. Голосовий провідник допоможе краще зрозуміти матеріал, а інтерактивний формат зробить навчання захопливим.",
  },
];

type FeaturesSectionProps = {
  /** Активний крок 0..2 (керується скролом у HomePage). */
  step: number;
};

const FeaturesSection = ({ step }: FeaturesSectionProps) => {
  const safeStep = Math.max(0, Math.min(CARDS.length - 1, step));
  const card = CARDS[safeStep];

  return (
    <>
      {/* Зовнішній контейнер задає довжину скролу (3 кроки); .sticky «залипає» на в'юпорт,
          поки їх проходиш — так глядач зафіксований на секції (без GSAP-pin). */}
      <section id="features" className={css.sectionOuter}>
        <div className={css.sticky}>
          <div className={css.section}>
            <div className={css.imageWrapper}>
              {/* Слот під 3D-АКМ (замість картинки akms). Габарити = аспект akms.png. */}
              <div
                id="akm-slot-features"
                className={css.akmSlot}
                aria-hidden="true"
              />
            </div>
            {/* AutoHeight тягне рамку картки під новий вміст плавно — інакше висота
                стрибала б на кожній зміні кроку й смикала верстку. */}
            <AutoHeight className={css.card} contentClassName={css.cardBody}>
              <div className={css.cardHeader}>
                <span className={css.cardNumber}>
                  <span className={css.cardZero}>0</span>
                  <span key={safeStep} className={css.cardDigit}>
                    {safeStep + 1}
                  </span>
                </span>
                <h2 key={`title-${safeStep}`} className={css.cardTitle}>
                  {card.title}
                </h2>
              </div>
              <p key={`text-${safeStep}`} className={css.cardText}>
                {card.text}
              </p>
            </AutoHeight>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;
