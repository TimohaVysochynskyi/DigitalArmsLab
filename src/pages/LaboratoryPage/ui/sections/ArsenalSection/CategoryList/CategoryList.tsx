import { useCallback, useLayoutEffect, useRef, useState } from "react";

import type { WeaponCategory, WeaponCategoryId } from "@/features/arsenal";
import CategoryItem from "./CategoryItem";

import css from "./CategoryList.module.css";

/** Синхронно з шириною .gradient у CSS. */
const GRADIENT_WIDTH = 227;

const EDGE_EPSILON = 1;

type CategoryListProps = {
  categories: WeaponCategory[];
  activeCategoryId: WeaponCategoryId;
  onSelect: (categoryId: WeaponCategoryId) => void;
  className?: string;
};

const CategoryList = ({
  categories,
  activeCategoryId,
  onSelect,
  className,
}: CategoryListProps) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<WeaponCategoryId, HTMLButtonElement>());

  const [fade, setFade] = useState({ left: false, right: false });

  const syncFade = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const maxScroll = strip.scrollWidth - strip.clientWidth;

    setFade({
      left: strip.scrollLeft > EDGE_EPSILON,
      right: strip.scrollLeft < maxScroll - EDGE_EPSILON,
    });
  }, []);

  // Зсув миттєвий і рівно на потрібну величину, щоб активна кнопка влізла повністю.
  const revealActive = useCallback(() => {
    const strip = stripRef.current;
    const item = itemsRef.current.get(activeCategoryId);
    if (!strip || !item) return;

    const maxScroll = strip.scrollWidth - strip.clientWidth;

    if (maxScroll > 0) {
      const itemLeft = item.offsetLeft;
      const itemRight = itemLeft + item.offsetWidth;

      const visibleLeft =
        strip.scrollLeft + (strip.scrollLeft > 0 ? GRADIENT_WIDTH : 0);
      const visibleRight =
        strip.scrollLeft +
        strip.clientWidth -
        (strip.scrollLeft < maxScroll ? GRADIENT_WIDTH : 0);

      if (itemRight > visibleRight) {
        strip.scrollLeft = Math.min(
          maxScroll,
          itemRight + GRADIENT_WIDTH - strip.clientWidth,
        );
      } else if (itemLeft < visibleLeft) {
        strip.scrollLeft = Math.max(0, itemLeft - GRADIENT_WIDTH);
      }
    }

    syncFade();
  }, [activeCategoryId, syncFade]);

  // ResizeObserver ловить і ресайз, і повернення з display: none (розміри 0 → реальні).
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    revealActive();

    const observer = new ResizeObserver(revealActive);
    observer.observe(strip);

    return () => observer.disconnect();
  }, [revealActive, categories]);

  return (
    <>
      <div className={`${css.slider} ${className ?? ""}`}>
        <div ref={stripRef} className={css.strip} onScroll={syncFade}>
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              ref={(node) => {
                if (node) itemsRef.current.set(category.id, node);
                else itemsRef.current.delete(category.id);
              }}
              isActive={category.id === activeCategoryId}
              onClick={() => onSelect(category.id)}
            >
              {category.name}
            </CategoryItem>
          ))}
        </div>

        {fade.left && (
          <div
            className={`${css.gradient} ${css.gradientLeft}`}
            aria-hidden="true"
          />
        )}
        {fade.right && (
          <div
            className={`${css.gradient} ${css.gradientRight}`}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
};

export default CategoryList;
