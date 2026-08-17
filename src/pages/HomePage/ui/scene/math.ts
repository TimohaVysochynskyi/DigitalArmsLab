/* Дрібні математичні хелпери для scroll-хореографії 3D. */

import { Matrix4, Vector3 } from "three";
import type { Euler, Mesh, Object3D } from "three";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Плавна S-крива (smoothstep) на [0, 1] — м'якший старт/фініш переходів. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/* Кадронезалежне згладжування: наздоганяє ціль із сталою швидкістю незалежно від FPS.
   Наївний `value += (target − value) * k` прив'язаний до частоти кадрів — на 144 Гц
   рух виходить різкішим, ніж на 60. `rate` — приблизно «наздоганянь за секунду». */
export const damp = (
  value: number,
  target: number,
  rate: number,
  delta: number,
) => value + (target - value) * (1 - Math.exp(-rate * delta));

/* Меші, які реально малюються, з матрицями у ВЛАСНІЙ системі координат root'а.

   Локальна система, а не світова, — принципово: світова протекла б поточними обертом і
   масштабом групи, у яку модель уже вставлено, і зняти геометрію повторно (наприклад, у
   розібраному стані вже після монтування) стало б неможливо.

   Індексний буфер обов'язковий: в оптимізованих glb (gltfpack/meshopt) вершинний буфер
   спільний для кількох примітивів, тож в атрибуті лежать і «сироти» — вершини, яких цей
   меш не малює. Прохід по всьому атрибуту давав силует у півтора раза більший за те, що
   видно на екрані, і вписування в бокс через це зменшувало модель. */
type DrawnMesh = { mesh: Mesh; used: Uint8Array | null; matrix: Matrix4 };

const drawnMeshes = (root: Object3D): DrawnMesh[] => {
  root.updateWorldMatrix(true, true);
  const toLocal = new Matrix4().copy(root.matrixWorld).invert();
  const meshes: DrawnMesh[] = [];

  root.traverse((object) => {
    const mesh = object as Mesh;
    const position = mesh.geometry?.attributes.position;
    if (!mesh.isMesh || !position) return;

    const indices = mesh.geometry.index;
    let used: Uint8Array | null = null;
    if (indices) {
      used = new Uint8Array(position.count);
      for (let i = 0; i < indices.count; i++) used[indices.getX(i)] = 1;
    }

    meshes.push({
      mesh,
      used,
      matrix: new Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld),
    });
  });

  return meshes;
};

/** Центр габаритів моделі та її радіус — обидва за один прохід, без тимчасових масивів. */
export const modelBounds = (root: Object3D) => {
  const vertex = new Vector3();
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const { mesh, used, matrix } of drawnMeshes(root)) {
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      if (used && !used[i]) continue;

      vertex.fromBufferAttribute(position, i).applyMatrix4(matrix);
      if (vertex.x < minX) minX = vertex.x;
      if (vertex.x > maxX) maxX = vertex.x;
      if (vertex.y < minY) minY = vertex.y;
      if (vertex.y > maxY) maxY = vertex.y;
      if (vertex.z < minZ) minZ = vertex.z;
      if (vertex.z > maxZ) maxZ = vertex.z;
    }
  }

  const pivot = new Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  );
  // Радіус описаної сфери: не залежить від повороту, тож ним безпечно задавати межі
  // бінів по глибині для БУДЬ-ЯКОЇ пози.
  const radius =
    Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 1;

  return { pivot, radius };
};

export type Silhouette = {
  z: Float32Array;
  minX: Float32Array;
  maxX: Float32Array;
  minY: Float32Array;
  maxY: Float32Array;
  /** Габарит без урахування перспективи — стартова оцінка для ітерації. */
  flatWidth: number;
  flatHeight: number;
};

/* Профілі силуету одразу для КІЛЬКОХ поз — одним проходом по геометрії.

   Раніше це був ланцюжок окремих проходів (зібрати вершини → повернути → збінити, і так на
   кожну позу): вісім читань по 86–116 тис. вершин і кілька мегабайтів тимчасових масивів
   на кожну модель. На середньому телефоні це давало секундний фриз рівно в момент появи
   моделі. Тут геометрія читається один раз, на кожну вершину припадає по одному множенню
   на позу, а з пам'яті витрачаються лише самі біни. */
export const modelSilhouettes = (
  root: Object3D,
  pivot: Vector3,
  radius: number,
  poses: Euler[],
  binCount = 96,
): Silhouette[] => {
  const recenter = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
  const span = radius * 2;

  const bins = poses.map(() => ({
    z: new Float32Array(binCount).fill(-Infinity),
    minX: new Float32Array(binCount).fill(Infinity),
    maxX: new Float32Array(binCount).fill(-Infinity),
    minY: new Float32Array(binCount).fill(Infinity),
    maxY: new Float32Array(binCount).fill(-Infinity),
  }));

  const source = new Vector3();
  const vertex = new Vector3();

  for (const { mesh, used, matrix } of drawnMeshes(root)) {
    const position = mesh.geometry.attributes.position;
    // Оберт, рецентрування і трансформ меша згорнуті в одну матрицю на позу.
    const combined = poses.map((pose) =>
      new Matrix4().makeRotationFromEuler(pose).multiply(recenter).multiply(matrix),
    );

    for (let i = 0; i < position.count; i++) {
      if (used && !used[i]) continue;

      source.fromBufferAttribute(position, i);
      for (let p = 0; p < combined.length; p++) {
        vertex.copy(source).applyMatrix4(combined[p]);

        const bin = Math.min(
          binCount - 1,
          Math.max(0, Math.floor(((vertex.z + radius) / span) * binCount)),
        );
        const slot = bins[p];
        // За z у біні беремо НАЙБЛИЖЧИЙ до камери: він найсильніше збільшує, тож похибка
        // квантування завжди в бік «трохи менша модель», і за бокс вона не вилізе.
        if (vertex.z > slot.z[bin]) slot.z[bin] = vertex.z;
        if (vertex.x < slot.minX[bin]) slot.minX[bin] = vertex.x;
        if (vertex.x > slot.maxX[bin]) slot.maxX[bin] = vertex.x;
        if (vertex.y < slot.minY[bin]) slot.minY[bin] = vertex.y;
        if (vertex.y > slot.maxY[bin]) slot.maxY[bin] = vertex.y;
      }
    }
  }

  return bins.map((slot) => {
    // Порожні біни викидаємо, щоб не перевіряти їх на кожній ітерації вписування.
    const filled: number[] = [];
    for (let bin = 0; bin < binCount; bin++) {
      if (slot.maxX[bin] !== -Infinity) filled.push(bin);
    }

    const pick = (source: Float32Array) =>
      Float32Array.from(filled, (bin) => source[bin]);

    let flatMinX = Infinity, flatMaxX = -Infinity;
    let flatMinY = Infinity, flatMaxY = -Infinity;
    for (const bin of filled) {
      if (slot.minX[bin] < flatMinX) flatMinX = slot.minX[bin];
      if (slot.maxX[bin] > flatMaxX) flatMaxX = slot.maxX[bin];
      if (slot.minY[bin] < flatMinY) flatMinY = slot.minY[bin];
      if (slot.maxY[bin] > flatMaxY) flatMaxY = slot.maxY[bin];
    }

    return {
      z: pick(slot.z),
      minX: pick(slot.minX),
      maxX: pick(slot.maxX),
      minY: pick(slot.minY),
      maxY: pick(slot.maxY),
      flatWidth: flatMaxX - flatMinX || 1,
      flatHeight: flatMaxY - flatMinY || 1,
    };
  });
};

export type BoxFit = {
  /** Масштаб моделі, за якого її видимий силует рівно вписаний у бокс. */
  scale: number;
  /** Куди ставити групу (світові одиниці), щоб силует став по центру боксу. */
  positionX: number;
  positionY: number;
};

/* Вписування видимого силуету в бокс — з поправкою на перспективу.

   Плоского вписування замало через глибину моделі: у дрона передні промені з гвинтами
   ближчі до камери й проєктуються більшими (давало ~17% перевищення боксу). Ба більше,
   перспективний поділ діє й на ЗМІЩЕННЯ групи, тож модель, посунута вбік від центра
   екрана, ще й з'їжджає — тому масштаб і позицію треба шукати разом.

   Проєкція вершини на площину z=0 (камера в (0,0,C), дивиться вздовж −z):
     (px + scale·x, py + scale·y) · C/(C − scale·z)
   Величина нелінійна за scale, тож беремо плоску оцінку і кілька разів уточнюємо —
   ітерація стискаюча, 5 кроків сходяться із запасом.

   Працює по профілю силуету (poseSilhouette), а не по всіх вершинах — тому дешево
   настільки, що можна викликати щокадру. */
export const fitToBox = (
  silhouette: Silhouette,
  boxWidth: number,
  boxHeight: number,
  cameraZ: number,
  /** Бажаний центр силуету у світових одиницях на площині z = 0. */
  targetX: number,
  targetY: number,
  iterations = 5,
): BoxFit => {
  const { z, minX: sMinX, maxX: sMaxX, minY: sMinY, maxY: sMaxY } = silhouette;

  const measure = (scale: number, px: number, py: number) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < z.length; i++) {
      const depth = cameraZ - scale * z[i];
      // Захист від точок, що «пробили» камеру: фіт усе одно зійде на менший scale.
      const factor = depth > cameraZ * 0.05 ? cameraZ / depth : 0;
      const left = (px + sMinX[i] * scale) * factor;
      const right = (px + sMaxX[i] * scale) * factor;
      const bottom = (py + sMinY[i] * scale) * factor;
      const top = (py + sMaxY[i] * scale) * factor;
      if (left < minX) minX = left;
      if (right > maxX) maxX = right;
      if (bottom < minY) minY = bottom;
      if (top > maxY) maxY = top;
    }

    return {
      width: maxX - minX || 1,
      height: maxY - minY || 1,
      centerX: (maxX + minX) / 2,
      centerY: (maxY + minY) / 2,
    };
  };

  // Плоска стартова оцінка — габарит без перспективи.
  let scale = Math.min(
    boxWidth / silhouette.flatWidth,
    boxHeight / silhouette.flatHeight,
  );
  let positionX = targetX;
  let positionY = targetY;

  for (let i = 0; i < iterations; i++) {
    const measured = measure(scale, positionX, positionY);
    scale *= Math.min(boxWidth / measured.width, boxHeight / measured.height);
    positionX += targetX - measured.centerX;
    positionY += targetY - measured.centerY;
  }

  return { scale, positionX, positionY };
};
