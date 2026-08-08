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
  /** Шлях до .glb у /public/models. */
  modelUrl: string;
};

export type WeaponSpec = {
  aspect: string;
  value: string;
};

export type WeaponDetails = {
  /** Короткий опис; порожній рядок — секцію не показуємо. */
  summary: string;
  /** Принцип роботи. */
  operation: string;
  specs: WeaponSpec[];
  sources: string[];
};

export type WeaponDetail = Weapon & {
  details: WeaponDetails;
};

export type ArsenalData = {
  categories: WeaponCategory[];
  /** Порядок = порядок categories: зброя однієї категорії йде поспіль. */
  weapons: Weapon[];
};
