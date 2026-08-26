/* Налаштування сцени однієї одиниці зброї. Тюниться наживо. */

export const CAMERA_FOV = 35;
export const CAMERA_NEAR = 0.05;
export const CAMERA_FAR = 60;

/** Радіус, до якого нормалізується будь-яка модель (світові одиниці). */
export const MODEL_RADIUS = 1;

/* Початковий розмір моделі задається не множником, а часткою кадру: камера ставиться так,
   щоб реальні габарити моделі в стартовому ракурсі займали цю частку меншого виміру
   канваса. Тому на будь-якому екрані модель однаково велика і ніколи не обрізається.
   1 = впритул до країв, 0.9 = 10% запасу. */
export const FRAME_FILL = 0.95;

/** Дефолтна орбіта камери (сферичні кути, радіани). */
export const DEFAULT_ORBIT = { theta: Math.PI * 0.1, phi: Math.PI * 0.44 };

/** Межі зуму — множники до fit-дистанції (min менший = ближче можна під'їхати). */
export const ZOOM_LIMITS = { min: 0.3, max: 2.2 };

/** Межі нахилу, щоб не «провалюватись» під/над модель. */
export const POLAR_LIMITS = { min: Math.PI * 0.1, max: Math.PI * 0.9 };

/** Тривалість плавного повернення до дефолтного виду, с. */
export const RESET_DURATION = 0.8;

export const AUTO_ROTATE_SPEED = 1.2;

/** Стартовий доворот моделі, щоб вона дивилась профілем до глядача. */
export const MODEL_FACING: Record<string, [number, number, number]> = {
  "/models/akm-2048.ktx2.glb": [0, -Math.PI / 2, 0],
};

/** Можливі назви кліпів розбирання/збирання (у akm.glb — саме "diassemble"). */
export const ASSEMBLY_CLIPS = {
  disassemble: ["diassemble", "disassemble", "розбирання"],
  assemble: ["assemble", "збирання"],
};
