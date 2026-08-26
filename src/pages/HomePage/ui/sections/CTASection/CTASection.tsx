import { useEffect, useRef, type RefObject } from "react";

import VisionScanner from "@/shared/VisionScanner";
import CTAButton from "@/shared/CTAButton";
import type { Choreo } from "../../scene/types";

import css from "./CTASection.module.css";

// Чутливість ручного обертання (радіан на піксель перетягування) + межа нахилу.
const ROTATE_SENSITIVITY = 0.008;
const MAX_PITCH = (75 * Math.PI) / 180;

type CTASectionProps = {
  choreoRef: RefObject<Choreo>;
};

const CTASection = ({ choreoRef }: CTASectionProps) => {
  const slotRef = useRef<HTMLDivElement>(null);

  /* Ручне обертання АКМ саме в CTA: перетягування мишею/пальцем над слотом → доворот моделі.
     Пишемо в спільний choreo (модель читає його щокадру й застосовує лише в CTA). Слот
     перекриває зону моделі, тож захоплює жест; canvas сам pointer-events:none. */
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const choreo = choreoRef.current;
      choreo.akmManualYaw += (e.clientX - lastX) * ROTATE_SENSITIVITY;
      choreo.akmManualPitch = clamp(
        choreo.akmManualPitch + (e.clientY - lastY) * ROTATE_SENSITIVITY,
        -MAX_PITCH,
        MAX_PITCH,
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer вже відпущено — ігноруємо */
      }
      el.style.cursor = "grab";
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [choreoRef]);

  return (
    <>
      <section id="cta" className={css.sectionWrapper}>
        <VisionScanner className={css.visionScanner} />
        <div className={css.section}>
          {/* Слот-габарит АКМ і водночас зона захоплення для ручного обертання в CTA. */}
          <div
            id="akm-slot-cta"
            ref={slotRef}
            className={css.akmSlot}
            aria-hidden="true"
          />
          <CTAButton>дізнатись більше</CTAButton>
        </div>
      </section>
    </>
  );
};

export default CTASection;
