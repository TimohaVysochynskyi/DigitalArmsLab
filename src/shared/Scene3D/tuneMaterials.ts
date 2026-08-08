/* Пом'якшення матеріалів glb: делікатне відбиття оточення + мінімальна шорсткість,
   щоб дерево було матовим, а метал — не «дешевим». */

import type { Object3D } from "three";
import { Mesh, MeshStandardMaterial } from "three";

type Options = {
  envMapIntensity?: number;
  minRoughness?: number;
};

export const tuneMaterials = (
  root: Object3D,
  { envMapIntensity = 0.5, minRoughness = 0.65 }: Options = {},
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
      if ("roughness" in std && std.roughness < minRoughness)
        std.roughness = minRoughness;
    }
  });
};
