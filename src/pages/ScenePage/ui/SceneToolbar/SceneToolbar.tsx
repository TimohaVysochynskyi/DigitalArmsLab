import css from "./SceneToolbar.module.css";

type SceneToolbarProps = {
  className?: string;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
  isAutoRotating: boolean;
  onResetView: () => void;
  /** У моделі є кліпи розбирання — інакше кнопку не показуємо. */
  hasAssembly: boolean;
  isDisassembled: boolean;
  onToggleAssembly: () => void;
};

const SceneToolbar = ({
  className = "",
  isInfoOpen,
  onToggleInfo,
  isAutoRotating,
  onResetView,
  hasAssembly,
  isDisassembled,
  onToggleAssembly,
}: SceneToolbarProps) => {
  return (
    <div className={`${css.toolbar} ${className}`}>
      <button
        type="button"
        className={css.button}
        onClick={onToggleInfo}
        aria-pressed={isInfoOpen}
        aria-label="Інформація про зброю"
        title="Інформація про зброю"
      >
        <svg
          className={css.icon}
          viewBox="0 0 9 18"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3.81925 11.8463C3.81925 10.9321 3.95933 10.1696 4.2395 9.55875C4.51967 8.94775 5.09625 8.26025 5.96925 7.49625C6.57575 6.94758 7.0325 6.42675 7.3395 5.93375C7.6465 5.44075 7.8 4.88525 7.8 4.26725C7.8 3.37892 7.49392 2.63925 6.88175 2.04825C6.26958 1.45708 5.43333 1.1615 4.373 1.1615C3.51033 1.1615 2.82283 1.36217 2.3105 1.7635C1.79833 2.16483 1.3865 2.66417 1.075 3.2615L0 2.75775C0.427 1.90908 0.998167 1.23725 1.7135 0.74225C2.42883 0.247417 3.31533 0 4.373 0C5.85383 0 6.99458 0.423417 7.79525 1.27025C8.59592 2.11708 8.99625 3.10842 8.99625 4.24425C8.99625 4.97508 8.83633 5.64275 8.5165 6.24725C8.1965 6.85175 7.73008 7.42642 7.11725 7.97125C6.19808 8.78025 5.61892 9.44017 5.37975 9.951C5.14075 10.4618 5.02125 11.0936 5.02125 11.8463H3.81925ZM4.373 17.3078C4.10517 17.3078 3.87158 17.2081 3.67225 17.0087C3.47275 16.8094 3.373 16.5758 3.373 16.3078C3.373 16.0398 3.47275 15.8061 3.67225 15.6068C3.87158 15.4074 4.10517 15.3077 4.373 15.3077C4.641 15.3077 4.87467 15.4074 5.074 15.6068C5.27333 15.8061 5.373 16.0398 5.373 16.3078C5.373 16.5758 5.27333 16.8094 5.074 17.0087C4.87467 17.2081 4.641 17.3078 4.373 17.3078Z" />
        </svg>
      </button>

      <button
        type="button"
        className={css.button}
        onClick={onResetView}
        aria-pressed={isAutoRotating}
        aria-label={
          isAutoRotating ? "Зупинити обертання" : "Скинути вид і обертати"
        }
        title={isAutoRotating ? "Зупинити обертання" : "Скинути вид і обертати"}
      >
        <svg
          className={css.icon}
          viewBox="0 0 18 11"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.5385 10.7308L4.83075 10.023L6.9655 7.877C5.02433 7.61933 3.37817 7.13533 2.027 6.425C0.675667 5.71467 0 4.90633 0 4C0 2.92433 0.87275 1.98875 2.61825 1.19325C4.36375 0.39775 6.491 0 9 0C11.509 0 13.6363 0.39775 15.3818 1.19325C17.1273 1.98875 18 2.92433 18 4C18 4.72567 17.5452 5.4135 16.6355 6.0635C15.726 6.7135 14.5142 7.21283 13 7.5615V6.55C14.2833 6.21667 15.2708 5.80417 15.9625 5.3125C16.6542 4.82083 17 4.38333 17 4C17 3.42817 16.2875 2.78525 14.8625 2.07125C13.4375 1.35708 11.4833 1 9 1C6.51667 1 4.5625 1.35708 3.1375 2.07125C1.7125 2.78525 1 3.42817 1 4C1 4.477 1.55317 5.01067 2.6595 5.601C3.766 6.19133 5.16667 6.60892 6.8615 6.85375L4.83075 4.823L5.5385 4.1155L8.84625 7.423L5.5385 10.7308Z" />
        </svg>
      </button>

      {hasAssembly && (
        <button
          type="button"
          className={css.button}
          onClick={onToggleAssembly}
          aria-pressed={isDisassembled}
          aria-label={isDisassembled ? "Зібрати" : "Розібрати"}
          title={isDisassembled ? "Зібрати" : "Розібрати"}
        >
          <svg
            className={css.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9.5" y="9.5" width="5" height="5" />
            <path d="M3 7V3h4" />
            <path d="M21 7V3h-4" />
            <path d="M3 17v4h4" />
            <path d="M21 17v4h-4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SceneToolbar;
