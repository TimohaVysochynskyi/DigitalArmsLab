import type { ArsenalData } from "@/features/arsenal";
import Loader from "@/shared/Loader";

import CategoryList from "./CategoryList";
import CategoryDropdown from "./CategoryDropdown";
import WeaponSlider from "./WeaponSlider";
import type { ArsenalSlider } from "./useArsenalSlider";

import css from "./ArsenalSection.module.css";

type ArsenalSectionProps = {
  data: ArsenalData | null;
  isLoading: boolean;
  error: string | null;
  slider: ArsenalSlider;
};

const ArsenalSection = ({
  data,
  isLoading,
  error,
  slider,
}: ArsenalSectionProps) => {
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
