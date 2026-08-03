import { Link } from "react-router-dom";

import css from "./Header.module.css";
import NavigationLink from "@/shared/NavigationLink";
import MobileMenu from "./MobileMenu";

const Header = () => {
  return (
    <>
      <header className={css.headerWrapper}>
        <div className={css.header}>
          <Link to="/" className={css.logoWrapper}>
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
          </Link>
          <nav className={css.nav}>
            <ul className={css.navList}>
              <li>
                <NavigationLink to="#about">Про проєкт</NavigationLink>
              </li>
              <li>
                <NavigationLink to="#goal">Ціль</NavigationLink>
              </li>
              <li>
                <NavigationLink to="#contact">Зв'яжіться з нами</NavigationLink>
              </li>
            </ul>
            <NavigationLink to="/lab" accent>
              Лабораторія
            </NavigationLink>
          </nav>
          <MobileMenu />
        </div>
      </header>
    </>
  );
};

export default Header;
