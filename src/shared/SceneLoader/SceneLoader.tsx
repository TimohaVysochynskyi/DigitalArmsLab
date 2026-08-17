/* Індикатор завантаження 3D-сцени.

   ТИМЧАСОВИЙ вигляд: просто «Loading…». Оформлення за дизайнером — міняти треба лише
   розмітку й стилі тут, контракт («поки перша сцена не готова — показуємо») лишається.

   Показуємо лише ПЕРШЕ завантаження. Моделі під'їжджають по черзі (АКМ — при наближенні
   до Features), і блимати індикатором посеред скролу було б гірше, ніж не показувати
   нічого. Тому щойно перший ассет доїхав (`loaded > 0`), індикатор більше не з'являється. */

import { useProgress } from "@react-three/drei";
import css from "./SceneLoader.module.css";

const SceneLoader = () => {
  const { active, loaded } = useProgress();

  if (!active || loaded > 0) return null;

  return (
    <div className={css.loader} role="status" aria-live="polite">
      Loading…
    </div>
  );
};

export default SceneLoader;
