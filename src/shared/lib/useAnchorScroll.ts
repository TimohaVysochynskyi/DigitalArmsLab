import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ANCHOR_STATE_KEY, scrollToAnchor } from "./anchorScroll";

/** Доскрол до секції після переходу з іншої сторінки. Монтується один раз — у Layout. */
export const useAnchorScroll = () => {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();

  const anchor = (state as Record<string, unknown> | null)?.[ANCHOR_STATE_KEY];

  useEffect(() => {
    if (typeof anchor !== "string") return;

    scrollToAnchor(anchor);
    navigate(pathname, { replace: true, state: null });
  }, [anchor, pathname, navigate]);
};

export default useAnchorScroll;
