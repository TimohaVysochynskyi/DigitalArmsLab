/* Стандартний вигляд хуків у проєкті */

import { useEffect, useState } from "react";
import { getProfileData } from "../services/profile.service";
import type { ProfileData, ProfilePeriod } from "../model/profile.types";

export const useProfileData = () => {
    const [data, setData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState<ProfilePeriod>("year");

    useEffect(() => {
        const loadProfileData = async () => {
            setIsLoading(true);
            const response = await getProfileData();
            setData(response);
            setIsLoading(false);
        };

        void loadProfileData();
    }, []);

    return {
        data,
        isLoading,
        period,
        setPeriod,
    };
};
