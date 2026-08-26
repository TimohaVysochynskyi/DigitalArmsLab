/* Підготовка 3D-моделей до вебу: з вихідних .glb у models-src/ робить ті, що їдуть у прод.

   Навіщо. Вихідні моделі носять текстури в PNG/JPEG. Такі текстури браузер РОЗПАКОВУЄ на
   CPU і кладе в пам'ять GPU нестисненими (RGBA8): на дві моделі це було ~96 МБ відеопам'яті
   і майже 6 секунд блокування головного потоку на середньому телефоні. KTX2/BasisU їде в GPU
   вже стисненим — без розпакування і в ~8 разів компактніше.

   Вихідні лежать ПОЗА public/: усе з public/ копіюється в dist як є, і оригінали (десятки МБ)
   їхали б у прод мертвою вагою.

   Прапорці:
     -tc        текстури → KTX2 з BasisU (ETC1S);
     -tq 9      якість кодування (1..10); нижче 9 на нормал-мапах видно бруд;
     -tl <N>    стеля роздільності (див. textureLimit нижче);
     -c         meshopt-стиснення геометрії (декодер уже підключений через drei).

   Draco. gltfpack не читає KHR_draco_mesh_compression. Єдина така модель (makarov) лежить
   у models-src/ уже розпакованою через `npx gltf-transform copy`.

   Інструмент. Потрібен НАТИВНИЙ gltfpack: npm-збірка йде без кодувальника BasisU.
   Один файл, нікуди не встановлюється:
     https://github.com/zeux/meshoptimizer/releases → gltfpack-windows.zip → tools/gltfpack.exe
   Тека tools/ у .gitignore, бо це бінарник під конкретну платформу. */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = join(root, "models-src");
const output = join(root, "public", "models");

const GLTFPACK = process.env.GLTFPACK ?? join(root, "tools", "gltfpack.exe");

/* HomePage бере моделі зі стелею 1024: там АКМ і дрон ніколи не більші за ~1500px у кадрі,
   а 2048 коштували б учетверо дорожче на першому екрані.
   ScenePage — окремі збірки на 2048: там модель на весь в'юпорт і зум до ~3×. */
const MODELS = [
  { source: "akm", target: "akm.ktx2.glb", textureLimit: 1024 },
  { source: "mavic", target: "drone.ktx2.glb", textureLimit: 1024 },

  { source: "akm", target: "akm-2048.ktx2.glb", textureLimit: 2048 },
  { source: "mavic", target: "mavic-2048.ktx2.glb", textureLimit: 2048 },
  { source: "ar15", target: "ar15-2048.ktx2.glb", textureLimit: 2048 },
  { source: "makarov", target: "makarov-2048.ktx2.glb", textureLimit: 2048 },
  { source: "beretta-92", target: "beretta-92-2048.ktx2.glb", textureLimit: 2048 },
  { source: "f-1", target: "f-1-2048.ktx2.glb", textureLimit: 2048 },
  { source: "m67", target: "m67-2048.ktx2.glb", textureLimit: 2048 },
  { source: "fpv", target: "fpv-2048.ktx2.glb", textureLimit: 2048 },
];

const mb = (path) => (statSync(path).size / 1048576).toFixed(2);

if (!existsSync(GLTFPACK)) {
  console.error(
    `Не знайдено gltfpack: ${GLTFPACK}\n` +
      "Завантаж нативну збірку (див. коментар угорі файлу) або вкажи шлях у GLTFPACK.",
  );
  process.exit(1);
}

for (const { source, target, textureLimit } of MODELS) {
  const from = join(sources, `${source}.glb`);
  const to = join(output, target);

  if (!existsSync(from)) {
    console.error(`Немає вихідної моделі: ${from}`);
    process.exit(1);
  }

  process.stdout.write(`${target}: ${mb(from)} МБ → `);
  execFileSync(
    GLTFPACK,
    ["-i", from, "-o", to, "-tc", "-tq", "9", "-tl", String(textureLimit), "-c"],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`${mb(to)} МБ`);
}
