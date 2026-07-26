import type { ProfileUser } from "../../model/profile.types";
import css from "./ProfileSummaryCard.module.css";

import profileAvatar from "@/assets/svg/profile-avatar.svg";

type ProfileSummaryCardProps = {
  user: ProfileUser;
};

const ProfileSummaryCard = ({ user }: ProfileSummaryCardProps) => {
  return (
    <article className={css.card}>
      <div className={css.avatarPanel}>
        <button
          type="button"
          className={css.avatarConfirmCorner}
          aria-label="Змінити аватар"
        >
          <svg className={css.darkIcon} viewBox="0 0 20 15" fill="none">
            <path d="M20 1.57718L6.28571 15L0 8.84787L1.61143 7.27069L6.28571 11.8345L18.3886 0L20 1.57718Z" />
          </svg>
        </button>

        <div className={css.avatarBody}>
          <img
            src={profileAvatar}
            alt="Аватар користувача"
            className={css.avatarIcon}
          />
        </div>

        <button
          type="button"
          className={css.avatarEditCorner}
          aria-label="Редагувати профіль"
        >
          <svg className={css.darkIcon} viewBox="0 0 20 20" fill="none">
            <path d="M3.6425 16C3.6925 16 3.7425 15.995 3.7925 15.9875L7.9975 15.25C8.0475 15.24 8.095 15.2175 8.13 15.18L18.7275 4.5825C18.7507 4.55937 18.7691 4.5319 18.7816 4.50166C18.7942 4.47141 18.8006 4.43899 18.8006 4.40625C18.8006 4.37351 18.7942 4.34109 18.7816 4.31084C18.7691 4.2806 18.7507 4.25313 18.7275 4.23L14.5725 0.0725C14.525 0.025 14.4625 0 14.395 0C14.3275 0 14.265 0.025 14.2175 0.0725L3.62 10.67C3.5825 10.7075 3.56 10.7525 3.55 10.8025L2.8125 15.0075C2.78818 15.1414 2.79687 15.2793 2.83782 15.4091C2.87877 15.5389 2.95074 15.6568 3.0475 15.7525C3.2125 15.9125 3.42 16 3.6425 16ZM5.3275 11.64L14.395 2.575L16.2275 4.4075L7.16 13.4725L4.9375 13.865L5.3275 11.64ZM19.2 18.1H0.8C0.3575 18.1 0 18.4575 0 18.9V19.8C0 19.91 0.09 20 0.2 20H19.8C19.91 20 20 19.91 20 19.8V18.9C20 18.4575 19.6425 18.1 19.2 18.1Z" />
          </svg>
        </button>
      </div>

      <div className={css.infoRowPrimary}>
        <p className={css.name}>{user.name}</p>
        <button
          type="button"
          className={css.inlineEditButton}
          aria-label="Редагувати ім'я"
        >
          <svg className={css.lightIcon} viewBox="0 0 20 15" fill="none">
            <path d="M20 1.57718L6.28571 15L0 8.84787L1.61143 7.27069L6.28571 11.8345L18.3886 0L20 1.57718Z" />
          </svg>
        </button>
      </div>

      <div className={css.infoRowSecondary}>
        <p className={css.email}>{user.email}</p>
        <button
          type="button"
          className={css.inlineEditButton}
          aria-label="Редагувати email"
        >
          <svg className={css.lightIcon} viewBox="0 0 20 20" fill="none">
            <path d="M3.6425 16C3.6925 16 3.7425 15.995 3.7925 15.9875L7.9975 15.25C8.0475 15.24 8.095 15.2175 8.13 15.18L18.7275 4.5825C18.7507 4.55937 18.7691 4.5319 18.7816 4.50166C18.7942 4.47141 18.8006 4.43899 18.8006 4.40625C18.8006 4.37351 18.7942 4.34109 18.7816 4.31084C18.7691 4.2806 18.7507 4.25313 18.7275 4.23L14.5725 0.0725C14.525 0.025 14.4625 0 14.395 0C14.3275 0 14.265 0.025 14.2175 0.0725L3.62 10.67C3.5825 10.7075 3.56 10.7525 3.55 10.8025L2.8125 15.0075C2.78818 15.1414 2.79687 15.2793 2.83782 15.4091C2.87877 15.5389 2.95074 15.6568 3.0475 15.7525C3.2125 15.9125 3.42 16 3.6425 16ZM5.3275 11.64L14.395 2.575L16.2275 4.4075L7.16 13.4725L4.9375 13.865L5.3275 11.64ZM19.2 18.1H0.8C0.3575 18.1 0 18.4575 0 18.9V19.8C0 19.91 0.09 20 0.2 20H19.8C19.91 20 20 19.91 20 19.8V18.9C20 18.4575 19.6425 18.1 19.2 18.1Z" />
          </svg>
        </button>
      </div>
    </article>
  );
};

export default ProfileSummaryCard;
