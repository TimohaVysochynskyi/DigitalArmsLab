/* Математика 3D-хореографії HomePage.

   Файл відповідає на три запитання:
     1. Скільки і як інтерполювати (lerp / clamp01 / smoothstep / damp).
     2. Який РЕАЛЬНИЙ силует має модель у заданій позі (modelBounds / modelSilhouettes).
     3. Який масштаб і позиція потрібні, щоб цей силует рівно ліг у DOM-бокс (fitToBox).

   Пункти 2–3 існують заради одного контракту проєкту: розмір і місце моделі задає CSS
   (порожній div-слот у розмітці секції), а не константа в TS. */

import { Matrix4, Vector3 } from "three";
import type { Euler, Mesh, Object3D } from "three";

/* ------------------------------------------------------------------ */
/* Інтерполяція                                                        */
/* ------------------------------------------------------------------ */

/** Лінійна інтерполяція: t = 0 → from, t = 1 → to. */
export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

/** Обрізає значення до [0, 1] — захист від прогресів, що вийшли за межі. */
export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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

/* ------------------------------------------------------------------ */
/* Обхід геометрії                                                     */
/* ------------------------------------------------------------------ */

/** Меш моделі разом із тим, що потрібно для коректного читання його вершин. */
type DrawnMesh = {
  mesh: Mesh;
  /** Прапорці «цю вершину меш реально малює»; null — індексного буфера немає. */
  usedVertices: Uint8Array | null;
  /** Трансформ меша у ВЛАСНІЙ системі координат root'а. */
  matrix: Matrix4;
};

/* Меші, які реально малюються, з матрицями у ВЛАСНІЙ системі координат root'а.

   Локальна система, а не світова, — принципово: світова протекла б поточними обертом і
   масштабом групи, у яку модель уже вставлено, і зняти геометрію повторно (наприклад, у
   розібраному стані вже після монтування) стало б неможливо.

   Індексний буфер обов'язковий: в оптимізованих glb (gltfpack/meshopt) вершинний буфер
   спільний для кількох примітивів, тож в атрибуті лежать і «сироти» — вершини, яких цей
   меш не малює. Прохід по всьому атрибуту давав силует у півтора раза більший за те, що
   видно на екрані, і вписування в бокс через це зменшувало модель. */
const drawnMeshes = (root: Object3D): DrawnMesh[] => {
  root.updateWorldMatrix(true, true);
  const worldToRoot = new Matrix4().copy(root.matrixWorld).invert();
  const result: DrawnMesh[] = [];

  root.traverse((object) => {
    const mesh = object as Mesh;
    const position = mesh.geometry?.attributes.position;
    if (!mesh.isMesh || !position) return;

    const indices = mesh.geometry.index;
    let usedVertices: Uint8Array | null = null;
    if (indices) {
      usedVertices = new Uint8Array(position.count);
      for (let i = 0; i < indices.count; i++) usedVertices[indices.getX(i)] = 1;
    }

    result.push({
      mesh,
      usedVertices,
      matrix: new Matrix4().multiplyMatrices(worldToRoot, mesh.matrixWorld),
    });
  });

  return result;
};

/* ------------------------------------------------------------------ */
/* Габарити моделі                                                     */
/* ------------------------------------------------------------------ */

export type ModelBounds = {
  /** Центр габаритної коробки: на нього зсуваємо модель, щоб обертати навколо себе. */
  pivot: Vector3;
  /** Радіус описаної сфери — межа, за яку модель не вийде в жодній позі. */
  radius: number;
};

/** Центр габаритів моделі та її радіус — обидва за один прохід, без тимчасових масивів. */
export const modelBounds = (root: Object3D): ModelBounds => {
  const vertex = new Vector3();
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const { mesh, usedVertices, matrix } of drawnMeshes(root)) {
    const position = mesh.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      if (usedVertices && !usedVertices[i]) continue;

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
  const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 1;

  return { pivot, radius };
};

/* ------------------------------------------------------------------ */
/* Профіль силуету                                                     */
/* ------------------------------------------------------------------ */

/* Силует моделі в одній позі, нарізаний на шари («біни») по глибині.

   Зберігати всі вершини не потрібно й задорого: для вписування в бокс важать лише крайні
   точки на кожному рівні глибини. Тому модель ділиться на binCount шарів уздовж осі
   погляду, і від кожного шару лишається його габарит.
   Усі масиви однакової довжини й індексуються паралельно: індекс i — це один шар. */
export type Silhouette = {
  /** Найближча до камери глибина шару — саме вона визначає його перспективне збільшення. */
  nearZ: Float32Array;
  minX: Float32Array;
  maxX: Float32Array;
  minY: Float32Array;
  maxY: Float32Array;
  /** Габарит без урахування перспективи — стартова оцінка для ітерації fitToBox. */
  flatWidth: number;
  flatHeight: number;
};

/** Накопичувач по бінах для однієї пози: заповнюється під час проходу по вершинах. */
type SilhouetteBins = {
  nearZ: Float32Array;
  minX: Float32Array;
  maxX: Float32Array;
  minY: Float32Array;
  maxY: Float32Array;
};

const createBins = (binCount: number): SilhouetteBins => ({
  nearZ: new Float32Array(binCount).fill(-Infinity),
  minX: new Float32Array(binCount).fill(Infinity),
  maxX: new Float32Array(binCount).fill(-Infinity),
  minY: new Float32Array(binCount).fill(Infinity),
  maxY: new Float32Array(binCount).fill(-Infinity),
});

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
  // Зсув у центр моделі + оберт у позу. Від меша не залежить, тож рахується один раз.
  const recenter = new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
  const poseMatrices = poses.map((pose) =>
    new Matrix4().makeRotationFromEuler(pose).multiply(recenter),
  );

  const depthSpan = radius * 2;
  const binsPerPose = poses.map(() => createBins(binCount));
  // Матриці «поза × трансформ меша» — переписуються на кожному меші, а не алокуються заново.
  const meshToPose = poses.map(() => new Matrix4());

  const local = new Vector3();
  const posed = new Vector3();

  for (const { mesh, usedVertices, matrix } of drawnMeshes(root)) {
    const position = mesh.geometry.attributes.position;
    for (let p = 0; p < poseMatrices.length; p++) {
      meshToPose[p].multiplyMatrices(poseMatrices[p], matrix);
    }

    for (let i = 0; i < position.count; i++) {
      if (usedVertices && !usedVertices[i]) continue;

      local.fromBufferAttribute(position, i);

      for (let p = 0; p < meshToPose.length; p++) {
        posed.copy(local).applyMatrix4(meshToPose[p]);

        // Глибина −radius..+radius → номер шару 0..binCount−1.
        const bin = Math.min(
          binCount - 1,
          Math.max(0, Math.floor(((posed.z + radius) / depthSpan) * binCount)),
        );
        const bins = binsPerPose[p];

        // За глибину шару беремо НАЙБЛИЖЧУ до камери точку: вона найсильніше збільшує,
        // тож похибка квантування завжди в бік «трохи менша модель» — за бокс не вилізе.
        if (posed.z > bins.nearZ[bin]) bins.nearZ[bin] = posed.z;
        if (posed.x < bins.minX[bin]) bins.minX[bin] = posed.x;
        if (posed.x > bins.maxX[bin]) bins.maxX[bin] = posed.x;
        if (posed.y < bins.minY[bin]) bins.minY[bin] = posed.y;
        if (posed.y > bins.maxY[bin]) bins.maxY[bin] = posed.y;
      }
    }
  }

  return binsPerPose.map((bins) => {
    // Порожні шари викидаємо, щоб не перевіряти їх на кожній ітерації вписування.
    const filled: number[] = [];
    for (let bin = 0; bin < binCount; bin++) {
      if (bins.maxX[bin] !== -Infinity) filled.push(bin);
    }

    const compact = (values: Float32Array) =>
      Float32Array.from(filled, (bin) => values[bin]);

    let flatMinX = Infinity, flatMaxX = -Infinity;
    let flatMinY = Infinity, flatMaxY = -Infinity;
    for (const bin of filled) {
      if (bins.minX[bin] < flatMinX) flatMinX = bins.minX[bin];
      if (bins.maxX[bin] > flatMaxX) flatMaxX = bins.maxX[bin];
      if (bins.minY[bin] < flatMinY) flatMinY = bins.minY[bin];
      if (bins.maxY[bin] > flatMaxY) flatMaxY = bins.maxY[bin];
    }

    return {
      nearZ: compact(bins.nearZ),
      minX: compact(bins.minX),
      maxX: compact(bins.maxX),
      minY: compact(bins.minY),
      maxY: compact(bins.maxY),
      flatWidth: flatMaxX - flatMinX || 1,
      flatHeight: flatMaxY - flatMinY || 1,
    };
  });
};

/* ------------------------------------------------------------------ */
/* Вписування в бокс                                                   */
/* ------------------------------------------------------------------ */

export type BoxFit = {
  /** Масштаб моделі, за якого її видимий силует рівно вписаний у бокс. */
  scale: number;
  /** Куди ставити групу (світові одиниці), щоб силует став по центру боксу. */
  positionX: number;
  positionY: number;
};

/** Екранний габарит силуету за конкретних масштабу й позиції. */
type ProjectedSize = {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
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

   Працює по профілю силуету (modelSilhouettes), а не по всіх вершинах — тому дешево
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
  const { nearZ, minX, maxX, minY, maxY } = silhouette;

  /** Проєктує всі шари силуету й повертає їхній спільний екранний габарит. */
  const project = (
    scale: number,
    offsetX: number,
    offsetY: number,
  ): ProjectedSize => {
    let left = Infinity;
    let right = -Infinity;
    let bottom = Infinity;
    let top = -Infinity;

    for (let bin = 0; bin < nearZ.length; bin++) {
      const distance = cameraZ - scale * nearZ[bin];
      // Захист від шарів, що «пробили» камеру: фіт усе одно зійде на менший scale.
      const magnify = distance > cameraZ * 0.05 ? cameraZ / distance : 0;

      const binLeft = (offsetX + minX[bin] * scale) * magnify;
      const binRight = (offsetX + maxX[bin] * scale) * magnify;
      const binBottom = (offsetY + minY[bin] * scale) * magnify;
      const binTop = (offsetY + maxY[bin] * scale) * magnify;

      if (binLeft < left) left = binLeft;
      if (binRight > right) right = binRight;
      if (binBottom < bottom) bottom = binBottom;
      if (binTop > top) top = binTop;
    }

    return {
      width: right - left || 1,
      height: top - bottom || 1,
      centerX: (right + left) / 2,
      centerY: (top + bottom) / 2,
    };
  };

  // Стартова оцінка — плоский габарит, без перспективи.
  let scale = Math.min(
    boxWidth / silhouette.flatWidth,
    boxHeight / silhouette.flatHeight,
  );
  let positionX = targetX;
  let positionY = targetY;

  for (let step = 0; step < iterations; step++) {
    const projected = project(scale, positionX, positionY);
    // Масштаб — за найтіснішим виміром (contain), позиція — на видиму похибку центра.
    scale *= Math.min(boxWidth / projected.width, boxHeight / projected.height);
    positionX += targetX - projected.centerX;
    positionY += targetY - projected.centerY;
  }

  return { scale, positionX, positionY };
};
