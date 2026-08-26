/* Картинки та моделі тимчасові — підміни, коли зʼявляться реальні рендери й glb. */

import type { ArsenalData } from "./arsenal.types";

import akmImage from "@/assets/images/weapons/akm.webp";
import ar15 from "@/assets/images/weapons/ar15.webp";
import makarov from "@/assets/images/weapons/makarov.webp";
import beretta from "@/assets/images/weapons/beretta.webp";
import f1 from "@/assets/images/weapons/f1.webp";
import m67 from "@/assets/images/weapons/m67.webp";
import fpv from "@/assets/images/weapons/fpv.webp";
import mavic from "@/assets/images/weapons/mavic.webp";

const AKM_MODEL = "/models/akm.ktx2.glb";
const DRONE_MODEL = "/models/drone.ktx2.glb";

export const ARSENAL_MOCK_DATA: ArsenalData = {
  categories: [
    { id: "rifles", name: "Штурмові гвинтівки" },
    { id: "pistols", name: "Пістолети" },
    { id: "grenades", name: "Гранати" },
    { id: "drones", name: "Дрони" },
  ],
  weapons: [
    {
      id: "akm",
      categoryId: "rifles",
      name: "АКМ",
      country: "СРСР",
      year: 1954,
      image: akmImage,
      modelUrl: AKM_MODEL,
    },
    {
      id: "ar15",
      categoryId: "rifles",
      name: "AR-15",
      country: "США",
      year: 1958,
      image: ar15,
      modelUrl: AKM_MODEL,
    },
    {
      id: "makarov",
      categoryId: "pistols",
      name: "П. Макарова",
      country: "СРСР",
      year: 1949,
      image: makarov,
      modelUrl: AKM_MODEL,
    },
    {
      id: "beretta-92",
      categoryId: "pistols",
      name: "Beretta 92",
      country: "Італія",
      year: 1975,
      image: beretta,
      modelUrl: AKM_MODEL,
    },
    {
      id: "f-1",
      categoryId: "grenades",
      name: "Ф-1",
      country: "СРСР",
      year: 1939,
      image: f1,
      modelUrl: AKM_MODEL,
    },
    {
      id: "m67",
      categoryId: "grenades",
      name: "M67",
      country: "США",
      year: 1968,
      image: m67,
      modelUrl: AKM_MODEL,
    },
    {
      id: "fpv",
      categoryId: "drones",
      name: "FPV дрон",
      country: "Україна",
      year: 2022,
      image: fpv,
      modelUrl: DRONE_MODEL,
    },
    {
      id: "mavic",
      categoryId: "drones",
      name: "Mavic 3 Cine",
      country: "Китай",
      year: 2021,
      image: mavic,
      modelUrl: DRONE_MODEL,
    },
  ],
};
