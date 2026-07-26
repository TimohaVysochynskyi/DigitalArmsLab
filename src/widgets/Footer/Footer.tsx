import { Link } from "react-router-dom";
import NavigationLink from "@/shared/NavigationLink";
import css from "./Footer.module.css";

const Footer = () => {
  return (
    <>
      <footer className={css.footerWrapper}>
        <div className={css.footer}>
          <div className={css.row}>
            <div className={css.description}>
              <div className={css.logoWrapper}>
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 512 512"
                  className={css.logo}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M256 32 20 464h472L256 32z"></path>
                </svg>
                <h1 className={css.title}>DigitalArmsLab</h1>
              </div>
              <p className={css.subtitle}>
                Занурся у світ сучасних та історичних зразків озброєння.
              </p>
            </div>
            <nav className={css.nav}>
              <ul className={css.navList}>
                <li>
                  <NavigationLink to="#about">Про проєкт</NavigationLink>
                </li>
                <li>
                  <NavigationLink to="#goal">Ціль</NavigationLink>
                </li>
                <li>
                  <NavigationLink to="#contact">
                    Зв'яжіться з нами
                  </NavigationLink>
                </li>
                <li>
                  <NavigationLink to="/lab" accent>
                    Лабораторія
                  </NavigationLink>
                </li>
              </ul>
            </nav>
          </div>
          <div className={css.row}>
            <span className={css.copyright}>
              © 2026 DigitalArmsLab. All rights reserved
            </span>
            <ul className={css.linkList}>
              <li>
                <Link to="/privacy-policy" className={css.link}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className={css.link}>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
