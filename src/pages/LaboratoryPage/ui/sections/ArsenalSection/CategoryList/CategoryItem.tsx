import type { Ref } from "react";

import css from "./CategoryList.module.css";

type Props = {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  ref?: Ref<HTMLButtonElement>;
};

const CategoryItem = ({ children, isActive, onClick, ref }: Props) => {
  return (
    <>
      <button
        ref={ref}
        type="button"
        className={`${css.button} ${isActive ? css.buttonActive : ""}`}
        onClick={onClick}
        aria-pressed={isActive}
      >
        {children}
      </button>
    </>
  );
};

export default CategoryItem;
