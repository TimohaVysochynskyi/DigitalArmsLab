/* Якщо в майбутньому планується інтеграція з повноцінним бакендом, то поки він не підключений, mock-дані повинні зберігатися приблизно в такому форматі */
/* Обов'язкова строга відповідність по типам даних */

import type { ProfileData } from "./profile.types";

export const PROFILE_MOCK_DATA: ProfileData = {
    user: {
        name: "Акакій Нечіпайко",
        email: "example@gmail.com",
        totalScore: 80,
        scenariosCompleted: 32,
        lastActivityDate: "26.02.2026",
        lastCompletedScenario: "Симуляція фішингу. Рівень 2",
    },
    activity: [
        { month: "Jan", value: 100 },
        { month: "Feb", value: 32 },
        { month: "Mar", value: 236 },
        { month: "Apr", value: 184 },
        { month: "May", value: 136 },
        { month: "Jun", value: 154 },
        { month: "Jul", value: 222 },
        { month: "Aug", value: 158 },
        { month: "Sep", value: 184 },
        { month: "Oct", value: 132 },
        { month: "Nov", value: 20 },
        { month: "Dec", value: 242 },
    ],
};
