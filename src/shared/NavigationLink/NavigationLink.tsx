import type { MouseEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { ANCHOR_STATE_KEY, isAnchor, scrollToAnchor } from "@/shared/lib";
import css from "./NavigationLink.module.css";

type PropsType = {
  /** Маршрут ("/lab") або якір секції головної ("#about"). */
  to: string;
  children: string;
  accent?: boolean;
};

const ANCHORS_PAGE = "/";

const NavigationLink = ({ to, children, accent }: PropsType) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isAnchor(to)) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    event.preventDefault();

    if (pathname === ANCHORS_PAGE) {
      scrollToAnchor(to);
      return;
    }

    navigate(ANCHORS_PAGE, { state: { [ANCHOR_STATE_KEY]: to } });
  };

  return (
    <>
      <NavLink
        to={to}
        onClick={handleClick}
        className={`${css.navigationLink} ${accent ? css.navigationLinkAccent : ""}`}
      >
        {children}
      </NavLink>
    </>
  );
};

export default NavigationLink;
