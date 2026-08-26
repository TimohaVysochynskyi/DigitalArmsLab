/* Вшивання довороту навколо Y у сам .glb.

   Навіщо. Моделі приходять від різних авторів і лежать у своїх файлах по-різному. Коли
   виняток тримався в коді (таблиця «цей файл довернути на стільки»), кожна нова модель
   вимагала свого рядка, а сцена не мала жодного єдиного «правильного» ракурсу. Дешевше
   один раз привести файл до спільної орієнтації — далі всі моделі кадруються однаково.

   Як. Правиться ЛИШЕ JSON-чанк: корені сцени загортаються в один вузол із потрібним
   поворотом. BIN-чанк (геометрія, KTX2-текстури, meshopt) не чіпається взагалі, індекси
   вузлів не зсуваються — тож канали анімацій лишаються робочими.

   Повторний запуск не множить обгортки: якщо вона вже є, просто оновлюється кут.

   CLI: node scripts/rotate-glb.mjs <файл.glb> <градуси> */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const HEADER = 12;
const CHUNK_HEADER = 8;
const WRAP_NODE = "__facing";

export const rotateGlbY = (file, degrees) => {
  const glb = readFileSync(file);

  if (glb.readUInt32LE(0) !== MAGIC) throw new Error(`Не GLB: ${file}`);
  if (glb.readUInt32LE(HEADER + 4) !== JSON_CHUNK)
    throw new Error(`Перший чанк не JSON: ${file}`);

  const jsonLength = glb.readUInt32LE(HEADER);
  const jsonStart = HEADER + CHUNK_HEADER;
  const json = JSON.parse(
    glb.subarray(jsonStart, jsonStart + jsonLength).toString("utf8"),
  );
  const binary = glb.subarray(jsonStart + jsonLength);

  const half = (degrees * Math.PI) / 360;
  const rotation = [0, Math.sin(half), 0, Math.cos(half)];

  const scene = json.scenes[json.scene ?? 0];
  const [first] = scene.nodes;
  const wrapped =
    scene.nodes.length === 1 && json.nodes[first]?.name === WRAP_NODE
      ? json.nodes[first]
      : null;

  if (wrapped) {
    wrapped.rotation = rotation;
  } else {
    json.nodes.push({ name: WRAP_NODE, rotation, children: scene.nodes });
    scene.nodes = [json.nodes.length - 1];
  }

  // Хвіст JSON-чанку добивається ПРОБІЛАМИ до 4 байтів — цього вимагає специфікація GLB.
  let text = JSON.stringify(json);
  while (Buffer.byteLength(text) % 4) text += " ";
  const chunk = Buffer.from(text, "utf8");

  const out = Buffer.alloc(HEADER + CHUNK_HEADER + chunk.length + binary.length);
  out.writeUInt32LE(MAGIC, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(chunk.length, HEADER);
  out.writeUInt32LE(JSON_CHUNK, HEADER + 4);
  chunk.copy(out, jsonStart);
  binary.copy(out, jsonStart + chunk.length);

  writeFileSync(file, out);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, degrees] = process.argv.slice(2);
  if (!file || degrees === undefined) {
    console.error("Використання: node scripts/rotate-glb.mjs <файл.glb> <градуси>");
    process.exit(1);
  }

  rotateGlbY(fileURLToPath(pathToFileURL(file)), Number(degrees));
  console.log(`${file}: доворот ${degrees}° вшито`);
}
