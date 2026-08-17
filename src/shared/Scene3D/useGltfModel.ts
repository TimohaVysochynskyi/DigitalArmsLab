/* Єдина точка завантаження 3D-моделей проєкту.

   Текстури моделей стиснені в KTX2/BasisU: вони йдуть у GPU вже стисненими, без
   розпакування на CPU. Це знімає дві проблеми одразу — довге блокування головного потоку
   на декоді PNG/JPEG і величезний слід у пам'яті (нестиснений RGBA8 коштував ~96 МБ на
   дві моделі проти ~20 МБ у стисненому вигляді). Ціною є транскодер, який треба підсунути
   лоадеру й «познайомити» з рендерером, щоб він обрав формат під конкретну GPU.

   Модулі-моделі мають імпортувати саме цей хук, а не useGLTF напряму: інакше KTX2-текстури
   просто не прочитаються, а помилка спливе далеко від причини. */

import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import type { WebGLRenderer } from "three";

/** Транскодер BasisU лежить у public/ (скопійований із three) і вантажиться на вимогу. */
const TRANSCODER_PATH = "/basis/";

/* Один транскодер на застосунок: він тримає WASM-модуль, і плодити копії немає сенсу.
   detectSupport залежить від рендерера, але рендерер у нас теж один (спільний Canvas). */
let shared: KTX2Loader | null = null;

const ktx2Loader = (renderer: WebGLRenderer) => {
  if (!shared) {
    shared = new KTX2Loader().setTranscoderPath(TRANSCODER_PATH);
    shared.detectSupport(renderer);
  }

  return shared;
};

/** Завантажує glb з підтримкою meshopt + KTX2. Викликати ЛИШЕ всередині Canvas. */
export const useGltfModel = (url: string) => {
  const renderer = useThree((state) => state.gl);

  // Тип лоадера бере drei — не анотуємо, інакше зіткнуться дві копії типів three.
  return useGLTF(url, true, true, (loader) => {
    loader.setKTX2Loader(ktx2Loader(renderer) as never);
  });
};

/** Прогріває кеш моделі. Поза Canvas, тож без detectSupport — його підставить хук. */
useGltfModel.preload = (url: string) => useGLTF.preload(url, true, true);
