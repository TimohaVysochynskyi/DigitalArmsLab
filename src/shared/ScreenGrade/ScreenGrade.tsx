/* Екранний грейд сторінки: віньєтка + плівкове зерно поверх усього кадру.

   Свідомо НЕ всередині 3D-канваса: обробка має лягати на всю сторінку — і на текст,
   і на фонове відео, і на 3D, — інакше шари виглядають зібраними з різних джерел.
   У канвасі лишається тільки Bloom, бо він про світло на самому об'єкті. */

import css from "./ScreenGrade.module.css";

const ScreenGrade = () => {
  return (
    <div className={css.grade} aria-hidden="true">
      <div className={css.vignette} />
      <div className={css.grain} />
    </div>
  );
};

export default ScreenGrade;
