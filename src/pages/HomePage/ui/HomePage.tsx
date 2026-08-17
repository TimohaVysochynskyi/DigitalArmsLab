import { lazy, Suspense, useRef, useState } from "react";

import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import FeaturesSection from "./sections/FeaturesSection";
import CTASection from "./sections/CTASection";
import ContactSection from "./sections/ContactSection/ContactSection";

import { useIdle } from "@/shared/lib/useIdle";
import ScreenGrade from "@/shared/ScreenGrade";
import SceneLoader from "@/shared/SceneLoader";

/* 3D тягне за собою three.js — окремий чанк на ~290 КБ. Статичний імпорт клав його в
   критичний шлях: заголовок Hero (а це LCP-елемент) не міг намалюватись, доки не
   завантажиться й розбереться рушій, який тексту взагалі не потрібен. Тепер сцена
   під'їжджає окремо, вже після того, як сторінку видно — інакше вона встигала забрати
   смугу ще ДО того, як намалювався заголовок. */
const HomeScene = lazy(() => import("./scene/HomeScene"));
import { createChoreo } from "./scene/types";

import css from "./HomePage.module.css";

const HomePage = () => {
  // Спільний мутабельний стан для 3D (без ре-рендерів) + дискретний крок картки Features.
  const choreoRef = useRef(createChoreo());
  const [featuresStep, setFeaturesStep] = useState(0);
  const sceneReady = useIdle();


  return (
    <>
      {sceneReady && (
        <Suspense fallback={null}>
          <HomeScene choreoRef={choreoRef} onFeaturesStep={setFeaturesStep} />
        </Suspense>
      )}

      <HeroSection />

      {/* Зона фонової SVG-сітки: покриває About→CTA (до початку Contacts) за будь-якої висоти. */}
      <div className={css.gridZone}>
        <div className={css.bgGrid} />
        <AboutSection />
        {/* Зона для top-down дрона між About і Features (лише ≤600; на десктопі height:0). */}
        <div id="drone-gap" className={css.droneGap} aria-hidden="true" />
        <FeaturesSection step={featuresStep} />
        <CTASection />
      </div>

      <ContactSection />

      <SceneLoader />

      {/* Обробка кадру — останнім шаром, поверх усього. */}
      <ScreenGrade />
    </>
  );
};

export default HomePage;
