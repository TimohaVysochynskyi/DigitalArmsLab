/* Дрібні математичні хелпери для scroll-хореографії 3D. */

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Плавна S-крива (smoothstep) на [0, 1] — м'якший старт/фініш переходів. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
