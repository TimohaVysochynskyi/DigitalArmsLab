import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import FeaturesSection from "./sections/FeaturesSection";
import CTASection from "./sections/CTASection";
import ContactSection from "./sections/ContactSection/ContactSection";

import css from "./HomePage.module.css";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <div className={css.bgGrid} />
      <AboutSection />
      <FeaturesSection />
      <CTASection />
      <ContactSection />
    </>
  );
};

export default HomePage;
