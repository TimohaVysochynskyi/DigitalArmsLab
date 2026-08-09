import { useRef, useState } from "react";

import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import FeaturesSection from "./sections/FeaturesSection";
import CTASection from "./sections/CTASection";
import ContactSection from "./sections/ContactSection/ContactSection";

import HomeScene from "./scene/HomeScene";
import { useHomeChoreography } from "./scene/useHomeChoreography";
import { createChoreo } from "./scene/types";

import css from "./HomePage.module.css";

const HomePage = () => {
  // Спільний мутабельний стан для 3D (без ре-рендерів) + дискретний крок картки Features.
  const choreoRef = useRef(createChoreo());
  const [featuresStep, setFeaturesStep] = useState(0);

  useHomeChoreography(choreoRef, setFeaturesStep);

  return (
    <>
      <HomeScene choreoRef={choreoRef} />

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
    </>
  );
};

export default HomePage;
