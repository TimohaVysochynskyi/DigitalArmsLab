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

/* Габаритна коробка бреше про розмір силуету: у дрона з розкинутими променями її кутки —
   порожнеча, і після повороту вони дають слід помітно більший за те, що реально видно
   (модель виходить меншою за свій бокс). Тому міряємо РЕАЛЬНІ вершини — той самий підхід,
   що й у ScenePage (projectVertices). Вершини збираємо один раз, далі крутимо їх дешево. */

/* Вершини моделі у ВЛАСНІЙ системі координат root'а — навмисно не у світовій.
   Світова протекла б поточними обертом/масштабом групи, у яку модель уже вставлено,
   і зняти геометрію повторно (наприклад, у розібраному стані вже після монтування)
   стало б неможливо: результат залежав би від того, як модель зараз повернута. */
export const collectVertices = (root: Object3D, knownPivot?: Vector3) => {
  root.updateWorldMatrix(true, true);
  const toLocal = new Matrix4().copy(root.matrixWorld).invert();

  /* Беремо лише вершини, на які реально посилається індексний буфер. В оптимізованих glb
     (gltfpack/meshopt) вершинний буфер спільний для кількох примітивів, тож в атрибуті
     лежать і «сироти» — вершини, які цей меш не малює. Прохід по всьому атрибуту давав
     силует у півтора раза більший за те, що видно на екрані, і вписування в бокс через це
     зменшувало модель. */
  const meshes: { mesh: Mesh; used: Uint8Array | null }[] = [];
  let total = 0;
  root.traverse((object) => {
    const mesh = object as Mesh;
    const position = mesh.geometry?.attributes.position;
    if (!mesh.isMesh || !position) return;

    const indices = mesh.geometry.index;
    if (!indices) {
      meshes.push({ mesh, used: null });
      total += position.count;
      return;
    }

    const used = new Uint8Array(position.count);
    let count = 0;
    for (let i = 0; i < indices.count; i++) {
      const vertex = indices.getX(i);
      if (!used[vertex]) {
        used[vertex] = 1;
        count++;
      }
    }
    meshes.push({ mesh, used });
    total += count;
  });

  const vertices = new Float32Array(total * 3);
  const vertex = new Vector3();
  let index = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const { mesh, used } of meshes) {
    const position = mesh.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      if (used && !used[i]) continue;

      vertex
        .fromBufferAttribute(position, i)
        .applyMatrix4(mesh.matrixWorld)
        .applyMatrix4(toLocal);
      vertices[index++] = vertex.x;
      vertices[index++] = vertex.y;
      vertices[index++] = vertex.z;
      if (vertex.x < minX) minX = vertex.x;
      if (vertex.x > maxX) maxX = vertex.x;
      if (vertex.y < minY) minY = vertex.y;
      if (vertex.y > maxY) maxY = vertex.y;
      if (vertex.z < minZ) minZ = vertex.z;
      if (vertex.z > maxZ) maxZ = vertex.z;
    }
  }

  // Центр габаритів. Для АКМ у розібраному стані центр інший, ніж у зібраному, тож
  // його можна передати ззовні — щоб обидва знімки лишились в одній системі відліку.
  const pivot =
    knownPivot ??
    new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);

  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] -= pivot.x;
    vertices[i + 1] -= pivot.y;
    vertices[i + 2] -= pivot.z;
  }

  return { vertices, pivot };
};

/** Вершини, повернуті в задану позу. Рахується раз на позу — далі фіт лише множить. */
export const rotateVertices = (vertices: Float32Array, pose: Euler) => {
  const rotated = new Float32Array(vertices.length);
  const vertex = new Vector3();

  for (let i = 0; i < vertices.length; i += 3) {
    vertex.set(vertices[i], vertices[i + 1], vertices[i + 2]).applyEuler(pose);
    rotated[i] = vertex.x;
    rotated[i + 1] = vertex.y;
    rotated[i + 2] = vertex.z;
  }

  return rotated;
};

/* Профіль силуету по «скибках» глибини.

   Вписати модель у бокс точно можна лише з поправкою на перспективу (ближчі до камери
   частини проєктуються більшими), а це залежить від масштабу — тобто потрібна ітерація.
   Ганяти сотні тисяч вершин на кожній ітерації щокадру не можна, а кешувати результат по
   позиції не вийде: слот у `position: sticky` рухається в документі щопікселя скролу.

   Тому один раз зводимо модель до профілю: ділимо її на біни по глибині й лишаємо в кожному
   крайні x/y. Екстремуми силуету за будь-якого масштабу лежать серед цих крайніх точок, а їх
   ~сотня — вписування стає настільки дешевим, що рахується щокадру без кешу.
   За z у біні беремо НАЙБЛИЖЧИЙ до камери: він найсильніше збільшує, тож похибка
   квантування завжди в бік «трохи менша модель», і за бокс вона не вилізе. */
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

export const poseSilhouette = (
  rotated: Float32Array,
  binCount = 96,
): Silhouette => {
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 2; i < rotated.length; i += 3) {
    if (rotated[i] < minZ) minZ = rotated[i];
    if (rotated[i] > maxZ) maxZ = rotated[i];
  }
  const span = maxZ - minZ || 1;

  const z = new Float32Array(binCount).fill(-Infinity);
  const minX = new Float32Array(binCount).fill(Infinity);
  const maxX = new Float32Array(binCount).fill(-Infinity);
  const minY = new Float32Array(binCount).fill(Infinity);
  const maxY = new Float32Array(binCount).fill(-Infinity);

  for (let i = 0; i < rotated.length; i += 3) {
    const x = rotated[i];
    const y = rotated[i + 1];
    const bin = Math.min(
      binCount - 1,
      Math.floor(((rotated[i + 2] - minZ) / span) * binCount),
    );
    if (rotated[i + 2] > z[bin]) z[bin] = rotated[i + 2];
    if (x < minX[bin]) minX[bin] = x;
    if (x > maxX[bin]) maxX[bin] = x;
    if (y < minY[bin]) minY[bin] = y;
    if (y > maxY[bin]) maxY[bin] = y;
  }

  // Порожні біни викидаємо, щоб не перевіряти їх на кожній ітерації.
  const used: number[] = [];
  for (let bin = 0; bin < binCount; bin++) {
    if (maxX[bin] !== -Infinity) used.push(bin);
  }

  const pick = (source: Float32Array) =>
    Float32Array.from(used, (bin) => source[bin]);

  let flatMinX = Infinity;
  let flatMaxX = -Infinity;
  let flatMinY = Infinity;
  let flatMaxY = -Infinity;
  for (const bin of used) {
    if (minX[bin] < flatMinX) flatMinX = minX[bin];
    if (maxX[bin] > flatMaxX) flatMaxX = maxX[bin];
    if (minY[bin] < flatMinY) flatMinY = minY[bin];
    if (maxY[bin] > flatMaxY) flatMaxY = maxY[bin];
  }

  return {
    z: pick(z),
    minX: pick(minX),
    maxX: pick(maxX),
    minY: pick(minY),
    maxY: pick(maxY),
    flatWidth: flatMaxX - flatMinX || 1,
    flatHeight: flatMaxY - flatMinY || 1,
  };
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
