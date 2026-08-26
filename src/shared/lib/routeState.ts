/* Стан переходу між сторінками (history state): що сторінка-приймач має відновити.

   Ключ зброї потрібен для повернення зі сцени в Лабораторію: слайдер має відкритись на тій
   самій одиниці. Саме state, а не query-параметр — це разова вказівка «куди стати», а не
   частина адреси сторінки. */

export const WEAPON_STATE_KEY = "weaponId";

export const readWeaponState = (state: unknown): string | undefined => {
  const value = (state as Record<string, unknown> | null)?.[WEAPON_STATE_KEY];

  return typeof value === "string" ? value : undefined;
};
