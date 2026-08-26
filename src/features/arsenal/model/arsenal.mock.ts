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

import akmAudio from "@/assets/audio/akm.mp3";
import ar15Audio from "@/assets/audio/ar15.mp3";
import makarovAudio from "@/assets/audio/makarov.mp3";
import berettaAudio from "@/assets/audio/beretta-92.mp3";
import f1Audio from "@/assets/audio/f-1.mp3";
import m67Audio from "@/assets/audio/m67.mp3";

/* ScenePage-збірки (стеля текстур 2048). HomePage бере свої 1024-версії напряму
   в AkmModel/DroneModel — вони тут не фігурують. */
const sceneModel = (id: string) => `/models/${id}-2048.ktx2.glb`;

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
      audioUrl: akmAudio,
      modelUrl: sceneModel("akm"),
    },
    {
      id: "ar15",
      categoryId: "rifles",
      name: "AR-15",
      country: "США",
      year: 1958,
      image: ar15,
      audioUrl: ar15Audio,
      modelUrl: sceneModel("ar15"),
    },
    {
      id: "makarov",
      categoryId: "pistols",
      name: "П. Макарова",
      country: "СРСР",
      year: 1949,
      image: makarov,
      audioUrl: makarovAudio,
      modelUrl: sceneModel("makarov"),
    },
    {
      id: "beretta-92",
      categoryId: "pistols",
      name: "Beretta 92",
      country: "Італія",
      year: 1975,
      image: beretta,
      audioUrl: berettaAudio,
      modelUrl: sceneModel("beretta-92"),
    },
    {
      id: "f1",
      categoryId: "grenades",
      name: "Ф-1",
      country: "СРСР",
      year: 1939,
      image: f1,
      audioUrl: f1Audio,
      modelUrl: sceneModel("f1"),
    },
    {
      id: "m67",
      categoryId: "grenades",
      name: "M67",
      country: "США",
      year: 1968,
      image: m67,
      audioUrl: m67Audio,
      modelUrl: sceneModel("m67"),
    },
    {
      id: "fpv",
      categoryId: "drones",
      name: "FPV дрон",
      country: "Україна",
      year: 2022,
      image: fpv,
      modelUrl: sceneModel("fpv"),
    },
    {
      id: "mavic",
      categoryId: "drones",
      name: "Mavic 3 Cine",
      country: "Китай",
      year: 2021,
      image: mavic,
      modelUrl: sceneModel("mavic"),
    },
  ],
};
