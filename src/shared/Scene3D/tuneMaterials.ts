/* Налаштування матеріалів glb під наш рендер.

   Головне, що тут лікується — спекулярний аліасинг: та сама «зернистість у дрібних пазах»,
   особливо помітна на телефоні, де модель займає мало пікселів і текстури сильно
   мінімізуються. Джерел у неї три, і кожне має свою ручку:

   anisotropy    — за замовчуванням у three це 1, тобто на скошених поверхнях текстура
                   вибирається грубо. Найдешевший і найпомітніший виграш, вигляд не змінює.
   normalScale   — блиск є нелінійною функцією нормалі, тож міп-рівні нормал-мапи його НЕ
                   усереднюють: дрібний рельєф дає мерехтіння. Ослаблення рельєфу прибирає
                   саме мерехтіння, майже не торкаючись форми.
   envMapIntensity — чим яскравіше оточення, тим сильніше видно те саме мерехтіння.

   Про шорсткість. У наших моделях `roughnessFactor` = 1, а справжня шорсткість лежить у
   текстурі, тож ПРОСТО ЗАДАТИ мінімум неможливо — і колишній `minRoughness` тут нічого не
   робив. За специфікацією glTF шорсткість = factor × канал текстури, тому єдиний робочий
   спосіб зробити поверхню матовішою — підняти сам множник (`roughnessBoost`). */

import type { Object3D, Texture } from "three";
import { Mesh, MeshStandardMaterial } from "three";

type Options = {
  envMapIntensity?: number;
  /** Максимум, який дає GPU (renderer.capabilities.getMaxAnisotropy()). */
  anisotropy?: number;
  /** Множник рельєфу нормал-мапи: <1 послаблює мерехтіння блиску. */
  normalScale?: number;
  /** Множник шорсткості: >1 робить поверхню матовішою (шорсткість = множник × текстура). */
  roughnessBoost?: number;
};

const TEXTURE_SLOTS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
] as const;

export const tuneMaterials = (
  root: Object3D,
  {
    envMapIntensity = 0.5,
    anisotropy,
    normalScale = 1,
    roughnessBoost = 1,
  }: Options = {},
) => {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    for (const material of materials) {
      const std = material as MeshStandardMaterial;

      if ("envMapIntensity" in std) std.envMapIntensity = envMapIntensity;
      if ("roughness" in std) std.roughness *= roughnessBoost;
      if (std.normalScale) std.normalScale.multiplyScalar(normalScale);

      if (anisotropy) {
        for (const slot of TEXTURE_SLOTS) {
          const texture = std[slot] as Texture | null | undefined;
          // Значення вище за максимум GPU three мовчки проігнорує, тож обмежуємо самі.
          if (texture && texture.anisotropy < anisotropy) {
            texture.anisotropy = anisotropy;
            texture.needsUpdate = true;
          }
        }
      }

      std.needsUpdate = true;
    }
  });
};
