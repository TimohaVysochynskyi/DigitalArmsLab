/* Спільний мутабельний стан хореографії 3D-сцени HomePage.
   Пишеться GSAP-ScrollTrigger'ами (поза Canvas), читається моделями в useFrame (у Canvas).
   Навмисно не React-стан — щоб скрол-скраб не викликав ре-рендерів. */

// Точні назви кліпів усередині akm.glb (idle/diassemble/assemble — саме так у моделі).
export type AkmClip = "idle" | "diassemble" | "assemble";

export type Choreo = {
  /** 0 — дрон у Hero (центр), 1 — у About (зміщений праворуч). */
  droneProgress: number;
  droneVisible: boolean;
  /** Чи показувати АКМ (діапазон Features..CTA). */
  akmVisible: boolean;
  /** Позиція АКМ: 0 = бокс Features, 1 = бокс CTA (переліт по скролу). */
  akmFlow: number;
  akmClip: AkmClip;
  /** 0..1 — позиція в межах кліпу (для скрабу diassemble/assemble). */
  akmScrub: number;
  /** Орієнтація АКМ у Features (радіани): yaw (доворот), pitch (нахил зверху), roll (у площині). */
  akmYaw: number;
  akmPitch: number;
  akmRollZ: number;
};

export const createChoreo = (): Choreo => ({
  droneProgress: 0,
  droneVisible: true,
  akmVisible: false,
  akmFlow: 0,
  akmClip: "idle",
  akmScrub: 0,
  akmYaw: 0,
  akmPitch: 0,
  akmRollZ: 0,
});

// id DOM-слотів, до боксів яких вписується АКМ (мають збігатися з розміткою секцій).
export const AKM_SLOT_ID = {
  features: "akm-slot-features",
  cta: "akm-slot-cta",
} as const;

export type AkmSlotKey = keyof typeof AKM_SLOT_ID;
