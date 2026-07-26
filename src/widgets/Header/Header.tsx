import css from "./Header.module.css";
import NavigationLink from "@/shared/NavigationLink";

const Header = () => {
  return (
    <>
      <header className={css.headerWrapper}>
        <div className={css.header}>
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
        </div>
      </header>
    </>
  );
};

export default Header;
