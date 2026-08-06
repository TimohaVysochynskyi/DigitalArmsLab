import Header from "./Header";
import Footer from "./Footer";
import { useAnchorScroll } from "@/shared/lib";
import css from "./Layout.module.css";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  useAnchorScroll();

  return (
    <div className={css.layout}>
      <Header />
      <main className={css.main}>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
