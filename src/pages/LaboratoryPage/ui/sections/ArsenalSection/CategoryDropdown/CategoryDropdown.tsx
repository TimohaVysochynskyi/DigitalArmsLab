import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { WeaponCategory, WeaponCategoryId } from "@/features/arsenal";

import css from "./CategoryDropdown.module.css";

/** Наскільки затемнення виступає над дропдауном. */
const BACKDROP_OFFSET = 8;

type CategoryDropdownProps = {
  categories: WeaponCategory[];
  activeCategoryId: WeaponCategoryId;
  onSelect: (categoryId: WeaponCategoryId) => void;
  className?: string;
};

const CategoryDropdown = ({
  categories,
  activeCategoryId,
  onSelect,
  className,
}: CategoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [backdropTop, setBackdropTop] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeCategory = categories.find(
    (category) => category.id === activeCategoryId,
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const root = rootRef.current;
      if (!root) return;

      // offsetParent зникає, коли дропдаун сховала медіа-квері.
      if (!root.offsetParent) {
        setIsOpen(false);
        return;
      }

      setBackdropTop(root.getBoundingClientRect().top - BACKDROP_OFFSET);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

  const handleSelect = (categoryId: WeaponCategoryId) => {
    onSelect(categoryId);
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={`${css.backdrop} ${isOpen ? css.backdropOpen : ""}`}
        style={{ top: backdropTop }}
        aria-hidden="true"
      />

      <div ref={rootRef} className={`${css.dropdown} ${className ?? ""}`}>
        <button
          type="button"
          className={css.trigger}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className={css.value}>{activeCategory?.name ?? ""}</span>

          <span className={css.chevronBox}>
            <svg
              className={`${css.chevron} ${isOpen ? css.chevronOpen : ""}`}
              viewBox="0 0 13 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M8.48992e-08 0.880503L6.5 8L13 0.880503L12.1846 -9.7232e-09L6.5 6.22642L0.81537 -1.453e-07L8.48992e-08 0.880503Z" />
            </svg>
          </span>
        </button>

        <div className={`${css.list} ${isOpen ? css.listOpen : ""}`}>
          <div className={css.listInner}>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${css.item} ${
                  category.id === activeCategoryId ? css.itemActive : ""
                }`}
                onClick={() => handleSelect(category.id)}
                aria-pressed={category.id === activeCategoryId}
                tabIndex={isOpen ? 0 : -1}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryDropdown;
