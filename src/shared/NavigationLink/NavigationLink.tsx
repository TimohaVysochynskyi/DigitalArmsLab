import { NavLink } from "react-router-dom";
import css from "./NavigationLink.module.css";

type PropsType = {
  to: string;
  children: string;
  accent?: boolean;
};

const NavigationLink = ({ to, children, accent }: PropsType) => {
  return (
    <>
      <NavLink
        to={to}
        className={`${css.navigationLink} ${accent && css.navigationLinkAccent}`}
      >
        {children}
      </NavLink>
    </>
  );
};

export default NavigationLink;
