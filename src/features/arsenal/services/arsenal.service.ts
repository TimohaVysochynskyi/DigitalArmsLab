/* Бекенду немає — повертаємо mock із /model. */

import { ARSENAL_MOCK_DATA } from "../model/arsenal.mock";
import { WEAPON_DETAILS_MOCK } from "../model/weapon-details.mock";
import type {
  ArsenalData,
  WeaponDetail,
  WeaponDetails,
} from "../model/arsenal.types";

const EMPTY_DETAILS: WeaponDetails = {
  summary: "",
  operation: "",
  specs: [],
  sources: [],
};

export const getArsenalData = async (): Promise<ArsenalData> => {
  return ARSENAL_MOCK_DATA;
};

export const getWeaponDetail = async (id: string): Promise<WeaponDetail> => {
  const weapon = ARSENAL_MOCK_DATA.weapons.find((item) => item.id === id);
  if (!weapon) throw new Error(`Зброю "${id}" не знайдено`);

  return { ...weapon, details: WEAPON_DETAILS_MOCK[id] ?? EMPTY_DETAILS };
};
