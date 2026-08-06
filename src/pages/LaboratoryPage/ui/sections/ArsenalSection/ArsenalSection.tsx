import { useArsenal } from "@/features/arsenal";
import Loader from "@/shared/Loader";

import CategoryList from "./CategoryList";
import CategoryDropdown from "./CategoryDropdown";
import WeaponSlider from "./WeaponSlider";
import { useArsenalSlider } from "./useArsenalSlider";

import css from "./ArsenalSection.module.css";

const ArsenalSection = () => {
  const { data, isLoading, error } = useArsenal();
  const slider = useArsenalSlider(data);

  return (
    <>
      <div className={css.container}>
        {isLoading && <Loader />}
        {error && <p className={css.error}>{error}</p>}

        {data && (
          <>
            <CategoryList
              className={css.categoryList}
              categories={data.categories}
              activeCategoryId={slider.activeCategoryId}
              onSelect={slider.goToCategory}
            />
            <CategoryDropdown
              className={css.categoryDropdown}
              categories={data.categories}
              activeCategoryId={slider.activeCategoryId}
              onSelect={slider.goToCategory}
            />
            <WeaponSlider slider={slider} />
          </>
        )}
      </div>
    </>
  );
};

export default ArsenalSection;
