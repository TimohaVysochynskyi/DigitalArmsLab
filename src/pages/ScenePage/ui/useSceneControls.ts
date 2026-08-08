/* Стан керування сценою: дравер, розбирання, автообертання та сигнал скидання виду.
   Кнопка виду: перший клік — плавне повернення в дефолт + повільне обертання,
   повторний — зупинка; будь-яке ручне обертання теж зупиняє. */

import { useCallback, useState } from "react";

export const useSceneControls = (weaponId: string | undefined) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDisassembled, setIsDisassembled] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hasAssembly, setHasAssembly] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [shownWeaponId, setShownWeaponId] = useState(weaponId);

  // Скидання стану при переході на іншу одиницю — під час рендера, без ефекту.
  if (shownWeaponId !== weaponId) {
    setShownWeaponId(weaponId);
    setIsInfoOpen(false);
    setIsDisassembled(false);
    setIsAutoRotating(false);
    setHasAssembly(false);
  }

  const toggleInfo = useCallback(() => setIsInfoOpen((prev) => !prev), []);
  const closeInfo = useCallback(() => setIsInfoOpen(false), []);
  const toggleAssembly = useCallback(
    () => setIsDisassembled((prev) => !prev),
    [],
  );
  const stopAutoRotate = useCallback(() => setIsAutoRotating(false), []);

  const resetView = useCallback(() => {
    if (isAutoRotating) {
      setIsAutoRotating(false);
      return;
    }

    setIsAutoRotating(true);
    setResetSignal((signal) => signal + 1);
  }, [isAutoRotating]);

  return {
    isInfoOpen,
    toggleInfo,
    closeInfo,
    isDisassembled,
    toggleAssembly,
    hasAssembly,
    setHasAssembly,
    isAutoRotating,
    resetView,
    stopAutoRotate,
    resetSignal,
  };
};
