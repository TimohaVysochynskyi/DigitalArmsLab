/* Підготовка 3D-моделей до вебу: з вихідних .glb робить ті, що реально їдуть у прод.

   Навіщо. Вихідні моделі носять текстури в PNG/JPEG. Такі текстури браузер РОЗПАКОВУЄ на
   CPU і кладе в пам'ять GPU нестисненими (RGBA8): на дві моделі це було ~96 МБ відеопам'яті
   і майже 6 секунд блокування головного потоку на середньому телефоні. KTX2/BasisU їде в GPU
   вже стисненим — без розпакування і в ~8 разів компактніше.

   Прапорці:
     -tc        текстури → KTX2 з BasisU (ETC1S);
     -tq 9      якість кодування (1..10); нижче 9 на нормал-мапах видно бруд;
     -tl 1024   стеля роздільності. Порівняння 2048 vs 1024 на дроні в Hero різниці не
                показало (він і в найбільшому кадрі ~1500px), а вага впала з 6.9 до 1.15 МБ;
     -c         meshopt-стиснення геометрії (декодер уже підключений через drei).

   Джерело — саме вихідні .glb, а не *.opt.glb: ті вже квантовані, і повторна упаковка
   накладала б похибку квантування вдруге (gltfpack про це прямо попереджає).

   Інструмент. Потрібен НАТИВНИЙ gltfpack: npm-збірка йде без кодувальника BasisU.
   Один файл, нікуди не встановлюється:
     https://github.com/zeux/meshoptimizer/releases → gltfpack-windows.zip → tools/gltfpack.exe
   Тека tools/ у .gitignore, бо це бінарник під конкретну платформу. */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const models = join(root, "public", "models");

const GLTFPACK = process.env.GLTFPACK ?? join(root, "tools", "gltfpack.exe");

/** Стеля роздільності текстур на модель — підбирається за найбільшим кадром, у якому
    модель реально показується. */
const MODELS = [{ name: "drone", textureLimit: 1024 }, { name: "akm", textureLimit: 1024 }];

const mb = (path) => (statSync(path).size / 1048576).toFixed(2);

if (!existsSync(GLTFPACK)) {
  console.error(
    `Не знайдено gltfpack: ${GLTFPACK}\n` +
      "Завантаж нативну збірку (див. коментар угорі файлу) або вкажи шлях у GLTFPACK.",
  );
  process.exit(1);
}

for (const { name, textureLimit } of MODELS) {
  const source = join(models, `${name}.glb`);
  const target = join(models, `${name}.ktx2.glb`);

  if (!existsSync(source)) {
    console.error(`Немає вихідної моделі: ${source}`);
    process.exit(1);
  }

  process.stdout.write(`${name}: ${mb(source)} МБ → `);
  execFileSync(
    GLTFPACK,
    ["-i", source, "-o", target, "-tc", "-tq", "9", "-tl", String(textureLimit), "-c"],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`${mb(target)} МБ`);
}
