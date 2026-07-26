/* Окремі типи даних фічі зберігаютьяс таким чином. Вони експортуються для можливості глобального використання, а не створення нових (бо це понесе за собою накладання і дублювання коду) */

export type ProfilePeriod = "month" | "quarter" | "year";

export type ProfileActivityPoint = {
    month: string;
    value: number;
};

export type ProfileUser = {
    name: string;
    email: string;
    totalScore: number;
    scenariosCompleted: number;
    lastActivityDate: string;
    lastCompletedScenario: string;
};

export type ProfileData = {
    user: ProfileUser;
    activity: ProfileActivityPoint[];
};
