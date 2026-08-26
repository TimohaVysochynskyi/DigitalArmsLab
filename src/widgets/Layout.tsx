import { useLocation } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import { getLayoutConfig } from "./layout.config";
import { useAnchorScroll, useScrollToTop } from "@/shared/lib";
import css from "./Layout.module.css";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  useScrollToTop();
  useAnchorScroll();

  const { pathname } = useLocation();
  const { hideFooter, accentLink } = getLayoutConfig(pathname);

  return (
    <div className={css.layout}>
      <Header accentLink={accentLink} />
      <main className={css.main}>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
