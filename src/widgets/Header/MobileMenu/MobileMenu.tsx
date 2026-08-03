import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import NavigationLink from "@/shared/NavigationLink";
import css from "./MobileMenu.module.css";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onResize = () => {
      if (window.innerWidth > 1024) close();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a")) close();
  };

  return (
    <>
      <button
        type="button"
        className={css.burger}
        aria-label="Відкрити меню"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => setIsOpen(true)}
      >
        <svg
          className={css.burgerIcon}
          viewBox="0 0 16 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 1V0H16V1H0ZM0 12V11H16V12H0ZM0 6.5V5.5H16V6.5H0Z" />
        </svg>
      </button>

      <div
        id="mobile-menu"
        className={`${css.overlay} ${isOpen ? css.overlayOpen : ""}`}
        aria-hidden={!isOpen}
      >
        <div className={css.bgGradient} />
        <div className={css.bar}>
          <Link
            to="/"
            className={css.logoWrapper}
            aria-label="На головну"
            onClick={close}
          >
            <svg viewBox="0 0 512 512" className={css.logo} aria-hidden="true">
              <path d="M256 32 20 464h472L256 32z" />
            </svg>
          </Link>

          <button
            type="button"
            className={css.close}
            aria-label="Закрити меню"
            onClick={close}
          >
            <svg
              className={css.closeIcon}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0.897626 16L0 15.1024L7.10237 8L0 0.897626L0.897626 0L8 7.10237L15.1024 0L16 0.897626L8.89762 8L16 15.1024L15.1024 16L8 8.89762L0.897626 16Z" />
            </svg>
          </button>
        </div>

        <div className={css.body} onClick={handleContentClick}>
          <div className={css.bodyTop}>
            <nav className={css.nav}>
              <ul className={css.primaryList}>
                <li>
                  <NavigationLink to="/">Головна</NavigationLink>
                </li>
                <li>
                  <NavigationLink to="/lab" accent>
                    Лабораторія
                  </NavigationLink>
                </li>
              </ul>

              <ul className={css.secondaryList}>
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
              </ul>
            </nav>

            <ul className={css.contactsList}>
              <li className={css.contactItem}>
                <span className={css.contactLabel}>Email</span>
                <a
                  className={css.contactValue}
                  href="mailto:timohavysach@gmail.com"
                >
                  timohavysach@gmail.com
                </a>
              </li>
              <li className={css.contactItem}>
                <span className={css.contactLabel}>Телефон</span>
                <a
                  className={`${css.contactValue} ${css.contactPhone}`}
                  href="tel:+380688754013"
                >
                  +380 68 875 40 13
                </a>
              </li>
            </ul>
          </div>

          <ul className={css.socialsList}>
            <li>
              <a href="#">
                <svg
                  className={css.socialsIcon}
                  viewBox="0 0 39 39"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.184 0C6.01401 -1.60009e-07 3.93286 0.861809 2.39815 2.39593C0.863441 3.93005 0.000833328 6.01087 0 8.18086V30.0049C0 32.1754 0.86224 34.257 2.39704 35.7918C3.93184 37.3266 6.01347 38.1889 8.184 38.1889H30.008C32.178 38.188 34.2588 37.3254 35.7929 35.7907C37.327 34.256 38.1889 32.1748 38.1889 30.0049V8.18086C38.188 6.01142 37.3258 3.93107 35.7918 2.39704C34.2578 0.86301 32.1774 0.00083296 30.008 0H8.184ZM32.362 8.19343C32.362 8.81858 32.1137 9.41813 31.6716 9.86018C31.2296 10.3022 30.63 10.5506 30.0049 10.5506C29.3797 10.5506 28.7802 10.3022 28.3381 9.86018C27.8961 9.41813 27.6477 8.81858 27.6477 8.19343C27.6477 7.56828 27.8961 6.96873 28.3381 6.52668C28.7802 6.08463 29.3797 5.83629 30.0049 5.83629C30.63 5.83629 31.2296 6.08463 31.6716 6.52668C32.1137 6.96873 32.362 7.56828 32.362 8.19343ZM19.0991 12.5557C17.3654 12.5557 15.7026 13.2444 14.4767 14.4704C13.2507 15.6964 12.562 17.3591 12.562 19.0929C12.562 20.8266 13.2507 22.4894 14.4767 23.7153C15.7026 24.9413 17.3654 25.63 19.0991 25.63C20.8329 25.63 22.4956 24.9413 23.7216 23.7153C24.9476 22.4894 25.6363 20.8266 25.6363 19.0929C25.6363 17.3591 24.9476 15.6964 23.7216 14.4704C22.4956 13.2444 20.8329 12.5557 19.0991 12.5557ZM9.416 19.0929C9.416 16.5256 10.4359 14.0634 12.2512 12.2481C14.0666 10.4327 16.5287 9.41286 19.096 9.41286C21.6633 9.41286 24.1254 10.4327 25.9408 12.2481C27.7561 14.0634 28.776 16.5256 28.776 19.0929C28.776 21.6602 27.7561 24.1223 25.9408 25.9377C24.1254 27.753 21.6633 28.7729 19.096 28.7729C16.5287 28.7729 14.0666 27.753 12.2512 25.9377C10.4359 24.1223 9.416 21.6602 9.416 19.0929Z"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a href="#">
                <svg
                  className={css.socialsIcon}
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M36.82 0.000279662H2.94C2.55916 -0.00500958 2.181 0.0647747 1.82713 0.205647C1.47326 0.34652 1.15061 0.555721 0.877595 0.821304C0.604583 1.08689 0.386563 1.40365 0.235984 1.7535C0.0854048 2.10335 0.00521679 2.47944 0 2.86028V37.1403C0.00521679 37.5211 0.0854048 37.8972 0.235984 38.2471C0.386563 38.5969 0.604583 38.9137 0.877595 39.1793C1.15061 39.4448 1.47326 39.654 1.82713 39.7949C2.181 39.9358 2.55916 40.0056 2.94 40.0003H36.82C37.2008 40.0056 37.579 39.9358 37.9329 39.7949C38.2867 39.654 38.6094 39.4448 38.8824 39.1793C39.1554 38.9137 39.3734 38.5969 39.524 38.2471C39.6746 37.8972 39.7548 37.5211 39.76 37.1403V2.86028C39.7548 2.47944 39.6746 2.10335 39.524 1.7535C39.3734 1.40365 39.1554 1.08689 38.8824 0.821304C38.6094 0.555721 38.2867 0.34652 37.9329 0.205647C37.579 0.0647747 37.2008 -0.00500958 36.82 0.000279662ZM12.06 33.4803H6.06V15.4803H12.06V33.4803ZM9.06 12.9603C8.23252 12.9603 7.43894 12.6316 6.85383 12.0465C6.26871 11.4613 5.94 10.6678 5.94 9.84028C5.94 9.0128 6.26871 8.21922 6.85383 7.63411C7.43894 7.04899 8.23252 6.72028 9.06 6.72028C9.49939 6.67045 9.94435 6.71399 10.3658 6.84805C10.7871 6.9821 11.1755 7.20366 11.5053 7.4982C11.8351 7.79275 12.0991 8.15364 12.2797 8.55724C12.4604 8.96085 12.5538 9.39807 12.5538 9.84028C12.5538 10.2825 12.4604 10.7197 12.2797 11.1233C12.0991 11.5269 11.8351 11.8878 11.5053 12.1824C11.1755 12.4769 10.7871 12.6985 10.3658 12.8325C9.94435 12.9666 9.49939 13.0101 9.06 12.9603ZM33.7 33.4803H27.7V23.8203C27.7 21.4003 26.84 19.8203 24.66 19.8203C23.9853 19.8252 23.3284 20.0368 22.7777 20.4266C22.227 20.8164 21.809 21.3656 21.58 22.0003C21.4235 22.4704 21.3557 22.9654 21.38 23.4603V33.4603H15.38V15.4603H21.38V18.0003C21.9251 17.0545 22.7178 16.2753 23.6729 15.7467C24.6279 15.218 25.7091 14.96 26.8 15.0003C30.8 15.0003 33.7 17.5803 33.7 23.1203V33.4803Z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="#">
                <svg
                  className={css.socialsIcon}
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M40 20C40 8.96 31.04 0 20 0C8.96 0 0 8.96 0 20C0 29.68 6.88 37.74 16 39.6V26H12V20H16V15C16 11.14 19.14 8 23 8H28V14H24C22.9 14 22 14.9 22 16V20H28V26H22V39.9C32.1 38.9 40 30.38 40 20Z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="#">
                <svg
                  className={css.socialsIcon}
                  viewBox="0 0 36 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M28.35 0H33.8709L21.8109 13.8189L36 32.6263H24.8914L16.1846 21.222L6.23314 32.6263H0.707143L13.6054 17.8406L0 0.0025714H11.3914L19.2497 10.4246L28.35 0ZM26.4086 29.3143H29.4686L9.72 3.13971H6.43886L26.4086 29.3143Z" />
                </svg>
              </a>
            </li>
          </ul>

          <div className={css.footer}>
            <div className={css.footerBrand}>
              <svg
                viewBox="0 0 512 512"
                className={css.logo}
                aria-hidden="true"
              >
                <path d="M256 32 20 464h472L256 32z" />
              </svg>
              <span className={css.footerName}>DigitalArmsLab</span>
            </div>
            <p className={css.footerText}>
              Занурся у світ сучасних та історичних зразків озброєння.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
