/** Дистанція камери, за якої сфера радіуса radius вписується і по висоті, і по ширині. */
export const fitDistance = (
  radius: number,
  fovDeg: number,
  aspect: number,
  padding: number,
) => {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.0001));

  return (radius / Math.sin(Math.min(vFov, hFov) / 2)) * padding;
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
