/* Налаштування сцени однієї одиниці зброї. Тюниться наживо. */

export const CAMERA_FOV = 35;

/** Радіус, до якого нормалізується будь-яка модель (світові одиниці). */
export const MODEL_RADIUS = 1;

/** Запас навколо моделі при вписуванні в кадр. */
export const FIT_PADDING = 1.45;

/** Кратність наближення до вписаного кадру: 3 = модель удвічі більша. Сюди ж повертає скид виду. */
export const MODEL_ZOOM = 3;

/** Дефолтна орбіта камери (сферичні кути, радіани). */
export const DEFAULT_ORBIT = { theta: Math.PI * 0.1, phi: Math.PI * 0.44 };

/** Межі зуму — множники до fit-дистанції. */
export const ZOOM_LIMITS = { min: 0.5, max: 2.2 };

/** Межі нахилу, щоб не «провалюватись» під/над модель. */
export const POLAR_LIMITS = { min: Math.PI * 0.1, max: Math.PI * 0.9 };

/** Тривалість плавного повернення до дефолтного виду, с. */
export const RESET_DURATION = 0.8;

export const AUTO_ROTATE_SPEED = 1.2;

/** Стартовий доворот моделі, щоб вона дивилась профілем до глядача. */
export const MODEL_FACING: Record<string, [number, number, number]> = {
  "/models/akm.opt.glb": [0, -Math.PI / 2, 0],
};

/** Можливі назви кліпів розбирання/збирання (у akm.glb — саме "diassemble"). */
export const ASSEMBLY_CLIPS = {
  disassemble: ["diassemble", "disassemble", "розбирання"],
  assemble: ["assemble", "збирання"],
};
