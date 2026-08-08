/* Бічний дравер із довідкою. Завжди в DOM (щоб анімувати відкриття класом),
   але закритий інертний: aria-hidden + inert. */

import { useEffect } from "react";

import type { WeaponDetail } from "@/features/arsenal";

import css from "./WeaponInfoDrawer.module.css";

type WeaponInfoDrawerProps = {
  className?: string;
  weapon: WeaponDetail;
  isOpen: boolean;
  onClose: () => void;
};

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const WeaponInfoDrawer = ({
  className = "",
  weapon: { name, country, year, details },
  isOpen,
  onClose,
}: WeaponInfoDrawerProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <aside
      className={`${css.drawer} ${isOpen ? css.drawerOpen : ""} ${className}`}
      aria-labelledby="weapon-info-title"
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className={css.header}>
        <div>
          <h2 className={css.title} id="weapon-info-title">
            {name}
          </h2>
          <p className={css.meta}>
            {country} · {year}
          </p>
        </div>

        <button
          type="button"
          className={css.close}
          onClick={onClose}
          aria-label="Закрити інформацію"
        >
          <svg
            className={css.closeIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className={css.content}>
        {details.summary && (
          <section className={css.section}>
            <h3 className={css.sectionTitle}>Опис</h3>
            <p className={css.text}>{details.summary}</p>
          </section>
        )}

        {details.specs.length > 0 && (
          <section className={css.section}>
            <h3 className={css.sectionTitle}>Характеристики</h3>
            <dl className={css.specs}>
              {details.specs.map((spec) => (
                <div className={css.spec} key={spec.aspect}>
                  <dt className={css.specAspect}>{spec.aspect}</dt>
                  <dd className={css.specValue}>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {details.operation && (
          <section className={css.section}>
            <h3 className={css.sectionTitle}>Принцип роботи</h3>
            <p className={css.text}>{details.operation}</p>
          </section>
        )}

        {details.sources.length > 0 && (
          <section className={css.section}>
            <h3 className={css.sectionTitle}>Джерела</h3>
            <ul className={css.sources}>
              {details.sources.map((source) => (
                <li key={source}>
                  <a
                    className={css.source}
                    href={source}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {hostname(source)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
};

export default WeaponInfoDrawer;
