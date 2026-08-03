/* GSAP-хореографія HomePage: пише у спільний Choreo (для 3D) і повідомляє активний крок
   Features (для картки). Тригериться по id секцій.

   Пін Features — CSS position:sticky (див. FeaturesSection). ScrollTrigger лише читає прогрес.
   scrub: SCRUB (число) додає інерцію → рухи моделей плавні, але тягнуться за скролом.
   Переліт АКМ Features→CTA — scroll-driven (akmFlow 0→1), як у дрона. */

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Choreo } from "./types";

gsap.registerPlugin(ScrollTrigger);

const FEATURES_STEPS = 3;
const SCRUB = 0.6; // інерція скрабу (сек) — баланс плавність/відгук

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;

// ─── A/B-перемикач режиму обертання АКМ у Features ───────────────────────────────
// "inspect" — АКМ лягає у 3/4 з поглядом зверху (тримається на фрізі), потім рівно.
// "orbit"   — повільний доворот через усі кроки + сталий легкий нахил зверху.
// Коли визначишся: лиши потрібну гілку у featuresOrientation() і прибери іншу + цю змінну.
const FEATURES_ROTATION_MODE = "inspect" as "inspect" | "orbit";

const INSPECT_YAW = -20 * D2R;
const INSPECT_PITCH = 18 * D2R;
const ORBIT_YAW_FROM = -25 * D2R;
const ORBIT_YAW_TO = 25 * D2R;
const ORBIT_PITCH = 12 * D2R;

type Orient = { yaw: number; pitch: number; roll: number };

const featuresOrientation = (seg: number, segP: number, p: number): Orient => {
  if (FEATURES_ROTATION_MODE === "orbit") {
    return { yaw: lerp(ORBIT_YAW_FROM, ORBIT_YAW_TO, p), pitch: ORBIT_PITCH, roll: 0 };
  }
  if (seg === 0) {
    return { yaw: lerp(0, INSPECT_YAW, segP), pitch: lerp(0, INSPECT_PITCH, segP), roll: 0 };
  }
  if (seg === 1) {
    return { yaw: INSPECT_YAW, pitch: INSPECT_PITCH, roll: 0 };
  }
  return { yaw: lerp(INSPECT_YAW, 0, segP), pitch: lerp(INSPECT_PITCH, 0, segP), roll: 0 };
};

export const useHomeChoreography = (
  choreoRef: RefObject<Choreo>,
  onFeaturesStep: (step: number) => void,
) => {
  useGSAP(
    () => {
      const c = choreoRef.current;
      let lastStep = -1;

      // Дрон видимий, поки в'юпорт перетинає Hero..About.
      ScrollTrigger.create({
        trigger: "#hero",
        start: "top bottom",
        endTrigger: "#about",
        end: "bottom top",
        onToggle: (self) => {
          c.droneVisible = self.isActive;
        },
      });

      // Політ дрона: завершується, поки About в'їжджає у в'юпорт.
      ScrollTrigger.create({
        trigger: "#about",
        start: "top bottom",
        end: "top top",
        scrub: SCRUB,
        onUpdate: (self) => {
          c.droneProgress = self.progress;
        },
      });

      // АКМ видимий у діапазоні Features..CTA.
      ScrollTrigger.create({
        trigger: "#features",
        start: "top bottom",
        endTrigger: "#cta",
        end: "bottom top",
        onToggle: (self) => {
          c.akmVisible = self.isActive;
        },
      });

      // Features (візуальний пін — CSS sticky): 3 кроки, АКМ у своєму боксі (flow = 0).
      ScrollTrigger.create({
        trigger: "#features",
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        onEnter: () => {
          c.akmClip = "diassemble";
          c.akmScrub = 0;
          c.akmYaw = 0;
          c.akmPitch = 0;
          c.akmRollZ = 0;
        },
        onUpdate: (self) => {
          const p = self.progress;
          const seg = Math.min(FEATURES_STEPS - 1, Math.floor(p * FEATURES_STEPS));
          const segP = p * FEATURES_STEPS - seg;

          if (seg !== lastStep) {
            lastStep = seg;
            onFeaturesStep(seg);
          }

          c.akmFlow = 0;
          // Крок 0 — розбірка (скраб); крок 1 — застигла розібрана поза; крок 2 — збірка.
          if (seg === 0) {
            c.akmClip = "diassemble";
            c.akmScrub = segP;
          } else if (seg === 1) {
            c.akmClip = "diassemble";
            c.akmScrub = 1;
          } else {
            c.akmClip = "assemble";
            c.akmScrub = segP;
          }

          const o = featuresOrientation(seg, segP, p);
          c.akmYaw = o.yaw;
          c.akmPitch = o.pitch;
          c.akmRollZ = o.roll;
        },
      });

      // Переліт АКМ Features→CTA (scroll-driven): від кінця Features до появи CTA у центрі.
      ScrollTrigger.create({
        trigger: "#features",
        start: "bottom bottom",
        endTrigger: "#cta",
        end: "top center",
        scrub: SCRUB,
        onUpdate: (self) => {
          c.akmFlow = self.progress;
          c.akmClip = "idle";
        },
      });
    },
    { dependencies: [choreoRef, onFeaturesStep] },
  );
};
