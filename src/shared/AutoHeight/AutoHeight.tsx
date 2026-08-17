/* Контейнер, що плавно тягнеться під висоту свого вмісту.

   Потрібен там, де вміст підмінюється (як картки Features): без цього блок стрибком
   змінює висоту і смикає за собою сусідню верстку.

   Чому не чистий CSS: `height: auto` не анімується — браузеру немає між чим інтерполювати.
   Тому міряємо реальну висоту вмісту через ResizeObserver і задаємо її в пікселях, а вже
   пікселі анімуються звичайним transition.

   Перший кадр лишається на `auto`: доки вміст не поміряно, фіксувати висоту не можна,
   інакше блок згорнувся б у нуль і «розкрився» на очах при завантаженні. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import css from "./AutoHeight.module.css";

type AutoHeightProps = {
  children: ReactNode;
  /** Тривалість переходу, мс. Має збігатися з анімацією самого вмісту. */
  duration?: number;
  /** Клас зовнішньої рамки: позиціонування й ширина. */
  className?: string;
  /* Клас самого вмісту: сюди йдуть падінги, рамка й розкладка. На зовнішній блок їх
     класти не можна — його висота дорівнює виміряній висоті вмісту, тож падінг з'їв би
     частину вмісту, а `overflow: hidden` її б обрізав. */
  contentClassName?: string;
};

const AutoHeight = ({
  children,
  duration = 550,
  className,
  contentClassName,
}: AutoHeightProps) => {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = content.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      // borderBoxSize точніший за contentRect: враховує падінги й рамку вмісту.
      const box = entry.borderBoxSize?.[0];
      setHeight(box ? box.blockSize : entry.contentRect.height);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={[css.frame, className].filter(Boolean).join(" ")}
      style={{
        height: height === null ? undefined : `${height}px`,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div ref={content} className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

export default AutoHeight;
