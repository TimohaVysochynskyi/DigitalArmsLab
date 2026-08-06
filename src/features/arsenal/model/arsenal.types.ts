export type WeaponCategoryId = string;

export type WeaponCategory = {
  id: WeaponCategoryId;
  name: string;
};

export type Weapon = {
  id: string;
  categoryId: WeaponCategoryId;
  name: string;
  country: string;
  year: number;
  image: string;
};

export type ArsenalData = {
  categories: WeaponCategory[];
  /** Порядок = порядок categories: зброя однієї категорії йде поспіль. */
  weapons: Weapon[];
};
