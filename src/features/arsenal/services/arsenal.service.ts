/* Бекенду немає — повертаємо mock із /model. */

import { ARSENAL_MOCK_DATA } from "../model/arsenal.mock";
import type { ArsenalData } from "../model/arsenal.types";

export const getArsenalData = async (): Promise<ArsenalData> => {
  return ARSENAL_MOCK_DATA;
};
