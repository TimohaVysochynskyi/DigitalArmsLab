/* Централізований експорт самої фічі та інших даних (наприклад, типи даних) */

export { default as ProfilePageFeature } from "./ui/ProfileLayout";
export type {
    ProfileData,
    ProfileUser,
    ProfileActivityPoint,
    ProfilePeriod,
} from "./model/profile.types";
