/* GSAP ScrollTrigger-хореографія HomePage.
   Пише у спільний мутабельний Choreo (його читають 3D-моделі в useFrame) і повідомляє
   активний крок Features для зміни картки. Пін Features — це CSS position:sticky
   (див. FeaturesSection); тут ScrollTrigger лише зчитує прогрес. */

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Choreo } from "./types";

gsap.registerPlugin(ScrollTrigger);

const DEG = Math.PI / 180;
const FEATURES_STEPS = 3;

// Інерція скрабу (сек): рухи моделей плавні, але наздоганяють скрол.
const SCRUB = 0.6;

// Поза «інспекції» АКМ у Features: розворот у 3/4 з поглядом трохи зверху.
const INSPECT_YAW = -20 * DEG;
const INSPECT_PITCH = 18 * DEG;

// Наскільки АКМ «розгорнутий в інспекцію» на кроці: 0→1 (розбірка), 1 (фріз), 1→0 (збірка).
const inspectAmount = (step: number, stepProgress: number) => {
  if (step === 0) return stepProgress;
  if (step === 1) return 1;
  return 1 - stepProgress;
};

export const useHomeChoreography = (
  choreoRef: RefObject<Choreo>,
  onFeaturesStep: (step: number) => void,
) => {
  useGSAP(
    () => {
      const choreo = choreoRef.current;
      let lastStep = -1;

      // --- Дрон: різна поведінка десктоп/мобайл (matchMedia авто-перебудовує на порозі 600) ---
      const mm = gsap.matchMedia();

      // Десктоп (>600): дрон летить у праву частину About і лишається з нею.
      mm.add("(min-width: 601px)", () => {
        ScrollTrigger.create({
          trigger: "#hero",
          start: "top bottom",
          endTrigger: "#about",
          end: "bottom top",
          onToggle: (self) => {
            choreo.droneVisible = self.isActive;
          },
        });
        ScrollTrigger.create({
          trigger: "#about",
          start: "top bottom",
          end: "top top",
          scrub: SCRUB,
          onUpdate: (self) => {
            choreo.droneProgress = self.progress;
          },
        });
      });

      // Мобайл (≤600): фаза 1 — спуск по центру через About; фаза 2 — доворот у вид згори
      // в геп-зоні (#drone-gap). Видимий Hero..кінець гепа.
      mm.add("(max-width: 600px)", () => {
        ScrollTrigger.create({
          trigger: "#hero",
          start: "top bottom",
          endTrigger: "#drone-gap",
          end: "bottom top",
          onToggle: (self) => {
            choreo.droneVisible = self.isActive;
          },
        });
        ScrollTrigger.create({
          trigger: "#about",
          start: "top bottom",
          end: "top top",
          scrub: SCRUB,
          onUpdate: (self) => {
            choreo.droneProgress = self.progress;
          },
        });
        ScrollTrigger.create({
          trigger: "#drone-gap",
          start: "top bottom",
          end: "center center",
          scrub: SCRUB,
          onUpdate: (self) => {
            choreo.droneGap = self.progress;
          },
        });
      });

      // АКМ видимий у діапазоні Features..CTA.
      ScrollTrigger.create({
        trigger: "#features",
        start: "top bottom",
        endTrigger: "#cta",
        end: "bottom top",
        onToggle: (self) => {
          choreo.akmVisible = self.isActive;
        },
      });

      // Features (візуальний пін — CSS sticky): 3 кроки. АКМ у своєму боксі (flow = 0):
      // крок 0 — розбірка, крок 1 — фріз розібраного, крок 2 — збірка; + поза «інспекції».
      ScrollTrigger.create({
        trigger: "#features",
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        onEnter: () => {
          choreo.akmClip = "diassemble";
          choreo.akmScrub = 0;
          choreo.akmYaw = 0;
          choreo.akmPitch = 0;
        },
        onUpdate: (self) => {
          const step = Math.min(
            FEATURES_STEPS - 1,
            Math.floor(self.progress * FEATURES_STEPS),
          );
          const stepProgress = self.progress * FEATURES_STEPS - step;

          if (step !== lastStep) {
            lastStep = step;
            onFeaturesStep(step);
          }

          choreo.akmFlow = 0;
          if (step === 0) {
            choreo.akmClip = "diassemble";
            choreo.akmScrub = stepProgress;
          } else if (step === 1) {
            choreo.akmClip = "diassemble";
            choreo.akmScrub = 1;
          } else {
            choreo.akmClip = "assemble";
            choreo.akmScrub = stepProgress;
          }

          const inspect = inspectAmount(step, stepProgress);
          choreo.akmYaw = INSPECT_YAW * inspect;
          choreo.akmPitch = INSPECT_PITCH * inspect;
        },
      });

      // Переліт АКМ Features → CTA (scroll-driven): від кінця Features до появи CTA у центрі.
      ScrollTrigger.create({
        trigger: "#features",
        start: "bottom bottom",
        endTrigger: "#cta",
        end: "top center",
        scrub: SCRUB,
        onUpdate: (self) => {
          choreo.akmFlow = self.progress;
          choreo.akmClip = "idle";
        },
      });

      return () => mm.revert();
    },
    { dependencies: [choreoRef, onFeaturesStep] },
  );
};
