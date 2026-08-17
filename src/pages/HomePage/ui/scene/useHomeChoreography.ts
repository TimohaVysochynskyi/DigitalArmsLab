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

const FEATURES_STEPS = 3;

// Інерція скрабу (сек): рухи моделей плавні, але наздоганяють скрол.
const SCRUB = 0.6;

export const useHomeChoreography = (
  choreoRef: RefObject<Choreo>,
  onFeaturesStep: (step: number) => void,
) => {
  useGSAP(
    () => {
      const choreo = choreoRef.current;
      let lastStep = -1;

      // --- Дрон: різна поведінка десктоп/мобайл (matchMedia авто-перебудовує на порозі 768).
      // Поріг має збігатися з MOBILE_MAX_WIDTH у DroneModel і з .droneGap у HomePage.module.css. ---
      const mm = gsap.matchMedia();

      // Десктоп (>768): дрон летить у праву частину About і лишається з нею.
      mm.add("(min-width: 769px)", () => {
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

      // Мобайл (≤768): фаза 1 — спуск по центру через About; фаза 2 — доворот у вид згори
      // в геп-зоні (#drone-gap). Видимий Hero..кінець гепа.
      mm.add("(max-width: 768px)", () => {
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

      // Features (візуальний пін — CSS sticky): 3 кроки картки. Зброя лишається ЗІБРАНОЮ,
      // а прогрес усього піна веде безперервний оберт «оглядового столу» (див. AkmModel).
      ScrollTrigger.create({
        trigger: "#features",
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        onUpdate: (self) => {
          const step = Math.min(
            FEATURES_STEPS - 1,
            Math.floor(self.progress * FEATURES_STEPS),
          );
          if (step !== lastStep) {
            lastStep = step;
            onFeaturesStep(step);
          }

          choreo.akmSpin = self.progress;
          choreo.akmFlow = 0;
        },
      });

      // Features → CTA: переліт у бокс CTA, доворот в оглядову позу і РОЗБИРАННЯ —
      // усе веде один прогрес, тож розбирання «в'їжджає» разом із секцією й реверсується
      // при скролі вгору.
      ScrollTrigger.create({
        trigger: "#features",
        start: "bottom bottom",
        endTrigger: "#cta",
        end: "top center",
        scrub: SCRUB,
        onUpdate: (self) => {
          choreo.akmFlow = self.progress;
        },
      });

      return () => mm.revert();
    },
    { dependencies: [choreoRef, onFeaturesStep] },
  );
};
