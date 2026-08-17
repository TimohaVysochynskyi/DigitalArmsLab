/* Застосовує налаштування матеріалів до завантаженої моделі.

   Окремий хук, а не виклик tuneMaterials у кожній моделі, з двох причин: анізотропію треба
   брати з можливостей конкретної GPU (а отже з рендерера), і робити це має одне місце —
   інакше кожна нова модель забуде частину налаштувань. Саме так і сталося з дроном: він
   ніколи не проходив через tuneMaterials і залишався з envMapIntensity = 1 та анізотропією
   за замовчуванням, через що мерехтів найсильніше.

   Викликати ЛИШЕ всередині Canvas. */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { Object3D } from "three";
import { tuneMaterials } from "./tuneMaterials";

type Options = {
  envMapIntensity?: number;
  normalScale?: number;
  roughnessBoost?: number;
};

export const useTunedMaterials = (scene: Object3D, options: Options = {}) => {
  const renderer = useThree((state) => state.gl);
  const { envMapIntensity, normalScale, roughnessBoost } = options;

  useEffect(() => {
    tuneMaterials(scene, {
      envMapIntensity,
      normalScale,
      roughnessBoost,
      anisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
  }, [scene, renderer, envMapIntensity, normalScale, roughnessBoost]);
};
