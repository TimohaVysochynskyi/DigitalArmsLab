/* Обрізає шрифти до символів, які проєкту реально потрібні.

   Навіщо. Шрифти важать більше, ніж 3D-модель (1386 КБ проти 1181), і на повільній мережі
   з'їдають смугу саме тоді, коли браузер тягне розмітку — тобто відсувають момент, коли
   видно текст. Причина в тому, що вихідні файли несуть повне покриття Unicode, а сайт
   україномовний: із тисяч гліфів потрібні сотні.

   Що лишаємо: базову латиницю з пунктуацією, весь кириличний блок (U+0400–04FF, щоб не
   зламався жоден текст), українські апострофи й лапки, типографські тире, № і ₴.
   Кирилицю беремо блоком навмисно: вибірка «лише вжиті зараз символи» зекономила б ще
   трохи, але будь-який новий текст ламався б підміною шрифту, і причину шукали б довго.

   Запуск: npm run fonts. Результат перезаписує woff2 на місці, тож вихідні тримаємо в git —
   повторний запуск на вже обрізаному файлі нічого не зіпсує, але й не дасть виграшу. */

import subsetFont from "subset-font";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = [join(root, "src", "assets", "fonts"), join(root, "public", "fonts")];

const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join("");

const CHARSET = [
  range(0x20, 0x7e), // латиниця, цифри, пунктуація
  range(0x0400, 0x04ff), // кирилиця цілим блоком
  " «»°–—‘’“”„…№₴−",
].join("");

const walk = async (dir) => {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else if (extname(entry.name) === ".woff2") found.push(path);
  }
  return found;
};

let before = 0;
let after = 0;

for (const dir of ROOTS) {
  let files;
  try {
    files = await walk(dir);
  } catch {
    continue; // теки може не бути — це нормально
  }

  for (const file of files) {
    const source = await readFile(file);
    const subset = await subsetFont(source, CHARSET, { targetFormat: "woff2" });

    // Обрізаний файл більший за вихідний означає, що шрифт уже обрізаний — не чіпаємо.
    if (subset.length >= source.length) {
      console.log(`${file.replace(root, ".").padEnd(58)} ${(source.length / 1024).toFixed(0)} КБ — без змін`);
      before += source.length;
      after += source.length;
      continue;
    }

    await writeFile(file, subset);
    before += source.length;
    after += subset.length;
    console.log(
      `${file.replace(root, ".").padEnd(58)} ${(source.length / 1024).toFixed(0).padStart(4)} → ${(subset.length / 1024).toFixed(0).padStart(4)} КБ`,
    );
  }
}

console.log(
  `\nразом: ${(before / 1024).toFixed(0)} → ${(after / 1024).toFixed(0)} КБ ` +
    `(−${(((before - after) / before) * 100).toFixed(0)}%)`,
);
