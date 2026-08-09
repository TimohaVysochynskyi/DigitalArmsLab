import { Spherical, Vector3, type Mesh, type Object3D } from "three";

/* Габаритна коробка для тонкої моделі (як автомат) бреше: її кутки — порожнеча, і
   кадрування по них лишає великі поля. Тому міряємо реальні вершини: для кожної
   зберігаємо зсув вбік/вгору від центра та зсув уздовж погляду. */
export type ModelProjection = {
  width: Float32Array;
  height: Float32Array;
  depth: Float32Array;
};

const WORLD_UP = new Vector3(0, 1, 0);
const MIN_ASPECT = 0.0001;

/** Напрямок «від моделі до камери» для орбіти в сферичних кутах. */
export const orbitDirection = (phi: number, theta: number) =>
  new Vector3().setFromSpherical(new Spherical(1, phi, theta));

const viewBasis = (direction: Vector3) => {
  const forward = direction.clone().normalize();
  const right = new Vector3().crossVectors(WORLD_UP, forward);
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
  right.normalize();
  const up = new Vector3().crossVectors(forward, right).normalize();

  return { right, up, forward };
};

export const projectVertices = (
  root: Object3D,
  direction: Vector3,
): ModelProjection => {
  const { right, up, forward } = viewBasis(direction);

  root.updateWorldMatrix(true, true);

  const meshes: Mesh[] = [];
  let total = 0;
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;

    meshes.push(mesh);
    total += mesh.geometry.attributes.position.count;
  });

  const projection: ModelProjection = {
    width: new Float32Array(total),
    height: new Float32Array(total),
    depth: new Float32Array(total),
  };

  const vertex = new Vector3();
  let index = 0;
  for (const mesh of meshes) {
    const position = mesh.geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      projection.width[index] = Math.abs(vertex.dot(right));
      projection.height[index] = Math.abs(vertex.dot(up));
      projection.depth[index] = vertex.dot(forward);
      index++;
    }
  }

  return projection;
};

/* Дистанція, з якої жодна вершина не виходить за частку fill від кадру. Для кожної
   вершини рахуємо мінімальну дистанцію, за якої вона ще в кадрі (з поправкою на її
   глибину: ближчі до камери проєктуються більшими), і беремо найсуворішу. */
export const fitDistance = (
  projection: ModelProjection,
  fovDeg: number,
  aspect: number,
  fill: number,
) => {
  const vFov = (fovDeg * Math.PI) / 180;
  const tanV = Math.tan(vFov / 2) * fill;
  const tanH = Math.tan(vFov / 2) * Math.max(aspect, MIN_ASPECT) * fill;

  const { width, height, depth } = projection;
  let distance = 0;

  for (let i = 0; i < depth.length; i++) {
    const byWidth = width[i] / tanH + depth[i];
    if (byWidth > distance) distance = byWidth;

    const byHeight = height[i] / tanV + depth[i];
    if (byHeight > distance) distance = byHeight;
  }

  return distance;
};

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Найкоротша різниця кутів у діапазоні [-π, π]. */
export const shortestAngle = (from: number, to: number) => {
  const delta = (to - from) % (Math.PI * 2);

  return delta > Math.PI
    ? delta - Math.PI * 2
    : delta < -Math.PI
      ? delta + Math.PI * 2
      : delta;
};
