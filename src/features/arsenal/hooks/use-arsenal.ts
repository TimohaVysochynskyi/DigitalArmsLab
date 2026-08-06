import { useEffect, useState } from "react";

import { getArsenalData } from "../services/arsenal.service";
import type { ArsenalData } from "../model/arsenal.types";

export const useArsenal = () => {
  const [data, setData] = useState<ArsenalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArsenal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        setData(await getArsenalData());
      } catch {
        setError("Не вдалося завантажити арсенал");
      } finally {
        setIsLoading(false);
      }
    };

    void loadArsenal();
  }, []);

  return { data, isLoading, error };
};
