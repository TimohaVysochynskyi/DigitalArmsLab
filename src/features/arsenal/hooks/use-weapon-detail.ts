import { useEffect, useState } from "react";

import { getWeaponDetail } from "../services/arsenal.service";
import type { WeaponDetail } from "../model/arsenal.types";

export const useWeaponDetail = (id: string | undefined) => {
  const [data, setData] = useState<WeaponDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isActual = true;

    const loadWeapon = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const weapon = await getWeaponDetail(id);
        if (isActual) setData(weapon);
      } catch {
        if (isActual) {
          setData(null);
          setError("Не вдалося завантажити дані про цю зброю");
        }
      } finally {
        if (isActual) setIsLoading(false);
      }
    };

    void loadWeapon();

    return () => {
      isActual = false;
    };
  }, [id]);

  if (!id) return { data: null, isLoading: false, error: "Зброю не вказано" };

  return { data, isLoading, error };
};
