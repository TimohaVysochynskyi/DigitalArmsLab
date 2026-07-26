import type { ProfileUser } from "../../model/profile.types";
import css from "./ProfileStatsSection.module.css";

type ProfileStatsSectionProps = {
  user: ProfileUser;
};

const ProfileStatsSection = ({ user }: ProfileStatsSectionProps) => {
  return (
    <section className={css.section} aria-label="Загальний бал та статистика">
      <header className={css.titleRow}>
        <h2 className={css.title}>Загальний бал</h2>
        <div className={css.titleLine} />
        <p className={css.score}>{user.totalScore}</p>
      </header>

      <div className={css.metricsRow}>
        <article className={css.card}>
          <span className={css.label}>Пройдено сценаріїв</span>
          <strong className={css.metricValue}>{user.scenariosCompleted}</strong>
        </article>

        <article className={css.card}>
          <span className={css.label}>Остання активність</span>
          <strong className={css.metricValue}>{user.lastActivityDate}</strong>
        </article>
      </div>

      <article className={css.card}>
        <span className={css.label}>Останній пройдений сценарій</span>
        <strong className={css.lastScenarioValue}>
          {user.lastCompletedScenario}
        </strong>
      </article>
    </section>
  );
};

export default ProfileStatsSection;
