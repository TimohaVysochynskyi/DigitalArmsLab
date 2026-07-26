import type { ReactNode } from "react";
import css from "./CTAButton.module.css";

const CTAButton = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div className={`${css.buttonWrapper} ${className}`}>
        <svg
          className={css.buttonIcon}
          viewBox="0 0 17 98"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1.00003 22.0526L1 1L16.8167 1" strokeWidth="2" />
          <path d="M1 22.0526V97L16.8167 97" strokeWidth="2" />
        </svg>

        <button type="button" className={css.button}>
          {children}
        </button>

        <svg
          className={css.buttonIcon}
          viewBox="0 0 17 98"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15.8164 21.2105V97L-0.000247732 97" strokeWidth="2" />
          <path d="M15.8164 22.0526L15.8164 1L-0.000247732 1" strokeWidth="2" />
        </svg>
      </div>
    </>
  );
};

export default CTAButton;
