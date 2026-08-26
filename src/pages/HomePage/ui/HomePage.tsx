import { lazy, Suspense, useRef, useState } from "react";

import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import FeaturesSection from "./sections/FeaturesSection";
import CTASection from "./sections/CTASection";
import ContactSection from "./sections/ContactSection/ContactSection";

import ScreenGrade from "@/shared/ScreenGrade";
import { hideAppLoader } from "@/shared/lib/appLoader";

/* 3D тягне за собою three.js — окремий чанк (~290 КБ), тож лишається `lazy`. Але тепер його
   монтуємо ОДРАЗУ (не чекаючи `useIdle`): стартовий лоадер (#app-loader) усе одно перекриває
   екран, поки вантажиться сцена, тож немає сенсу відкладати 3D — навпаки, хочемо, щоб сайт
   відкрився ВЖЕ зі сценою. Коли моделі готові, HomeScene кличе `onReady` → лоадер ховається. */
const HomeScene = lazy(() => import("./scene/HomeScene"));
import { createChoreo } from "./scene/types";

import css from "./HomePage.module.css";

const HomePage = () => {
  // Спільний мутабельний стан для 3D (без ре-рендерів) + дискретний крок картки Features.
  const choreoRef = useRef(createChoreo());
  const [featuresStep, setFeaturesStep] = useState(0);

  return (
    <>
      <Suspense fallback={null}>
        <HomeScene
          choreoRef={choreoRef}
          onFeaturesStep={setFeaturesStep}
          onReady={hideAppLoader}
        />
      </Suspense>

      <HeroSection />

      {/* Зона фонової SVG-сітки: покриває About→CTA (до початку Contacts) за будь-якої висоти. */}
      <div className={css.gridZone}>
        <div className={css.bgGrid} />
        <AboutSection />
        {/* Зона для top-down дрона між About і Features (лише ≤600; на десктопі height:0). */}
        <div id="drone-gap" className={css.droneGap} aria-hidden="true" />
        <FeaturesSection step={featuresStep} />
        <CTASection choreoRef={choreoRef} />
      </div>

      <ContactSection />

      {/* Обробка кадру — останнім шаром, поверх усього. */}
      <ScreenGrade />
    </>
  );
};

export default HomePage;
