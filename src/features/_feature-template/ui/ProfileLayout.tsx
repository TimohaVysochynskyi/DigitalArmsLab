/* Головний файл, який збирає всю фічу в єдине */

import { useProfileData } from "../hooks/use-profile-data";
import ProfileStatsSection from "./ProfileStatsSection";
import ProfileSummaryCard from "./ProfileSummaryCard";
import css from "./ProfileLayout.module.css";

const ProfileLayout = () => {
  const { data, isLoading } = useProfileData();

  if (isLoading || !data) {
    return (
      <section className={css.loadingState}>Завантаження профілю...</section>
    );
  }

  return (
    <section className={css.page} aria-label="Профіль">
      <div className={css.container}>
        <aside className={css.sidebar}>
          <ProfileSummaryCard user={data.user} />
        </aside>

        <div className={css.content}>
          <ProfileStatsSection user={data.user} />
        </div>
      </div>
    </section>
  );
};

export default ProfileLayout;
