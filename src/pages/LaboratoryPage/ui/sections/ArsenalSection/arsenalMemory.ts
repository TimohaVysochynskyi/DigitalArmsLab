/* Пам'ять вибору слайдера в межах вкладки: повернення до Лабораторії (кнопкою браузера,
   лінком у хедері чи зі сцени) має відкривати ту саму одиницю, а не перший слайд.

   sessionStorage, а не localStorage: це стан поточного сеансу перегляду, а не налаштування
   користувача. Доступ обгорнутий у try/catch — у приватному режимі сховище може кидати. */

const KEY = "arsenal:weapon";

export const readLastWeaponId = (): string | undefined => {
  try {
    return sessionStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

export const rememberWeaponId = (id: string) => {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    // Немає доступу до сховища — просто не запам'ятовуємо.
  }
};
