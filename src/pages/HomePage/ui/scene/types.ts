/* Спільний мутабельний стан хореографії 3D-сцени HomePage.
   Пишеться GSAP-ScrollTrigger'ами (поза Canvas), читається моделями в useFrame (у Canvas).
   Навмисно не React-стан — щоб скрол-скраб не викликав ре-рендерів. */

export type Choreo = {
  /** 0 — дрон у Hero (центр), 1 — у About (десктоп: праворуч; мобайл: спуск по центру). */
  droneProgress: number;
  /** Лише мобайл (≤600): 0 — дрон у About, 1 — доворот у вид згори в геп-зоні між About і Features. */
  droneGap: number;
  droneVisible: boolean;
  /** Чи показувати АКМ (діапазон Features..CTA). */
  akmVisible: boolean;
  /** 0..1 — прогрес піна Features. Веде повільний оберт «оглядового столу»; у цій
      секції зброя лишається ЗІБРАНОЮ, розбирання тут не програється. */
  akmSpin: number;
  /** 0 = бокс Features (зібраний), 1 = бокс CTA (розібраний).
      Веде одночасно переліт між слотами, доворот в оглядову позу і скраб розбирання. */
  akmFlow: number;
};

export const createChoreo = (): Choreo => ({
  droneProgress: 0,
  droneGap: 0,
  droneVisible: true,
  akmVisible: false,
  akmSpin: 0,
  akmFlow: 0,
});

/** id порожнього DOM-боксу в Hero, у який вписується дрон (позиція + розмір задаються CSS). */
export const DRONE_SLOT_ID = "drone-slot-hero";

// id DOM-слотів, до боксів яких вписується АКМ (мають збігатися з розміткою секцій).
export const AKM_SLOT_ID = {
  features: "akm-slot-features",
  cta: "akm-slot-cta",
} as const;

export type AkmSlotKey = keyof typeof AKM_SLOT_ID;
