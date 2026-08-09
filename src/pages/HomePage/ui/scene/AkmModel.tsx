/* eslint-disable react-hooks/immutability --
   керування анімаціями three.js — імперативне мутування AnimationAction/mixer (штатний
   патерн three, а не React-стан), тож правило тут незастосовне. */

/* АКМ — одна модель для двох слотів (Features та CTA). Її екранна позиція та розмір
   вписуються в DOM-бокс активного слота; при переході між секціями точка плавно перелітає
   від боксу Features до боксу CTA (choreo.akmFlow 0→1). Орієнтація у Features — поза
   «інспекції» (choreo.akmYaw/akmPitch), що при перельоті вирівнюється в горизонталь CTA. */

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import {
  Box3,
  Vector3,
  Euler,
  Group,
  PerspectiveCamera,
  LoopOnce,
  LoopRepeat,
} from "three";
import { tuneMaterials } from "@/shared/Scene3D";
import type { AkmClip, AkmSlotKey, Choreo } from "./types";
import { AKM_SLOT_ID } from "./types";
import { clamp01, lerp, smoothstep } from "./math";

const MODEL_URL = "/models/akm.opt.glb";
useGLTF.preload(MODEL_URL);

// Профіль до глядача (дефолт моделі — ствол уперед / приклад до нас).
const FACING: [number, number, number] = [0, -Math.PI / 2, 0];

// Матеріали: делікатне відбиття оточення + вища мінімальна шорсткість, щоб дерево було
// матовим і природним (без глянцевих «бардових» відблисків), а метал — не «дешевим».
const ENV_MAP_INTENSITY = 0.5;
const MIN_ROUGHNESS = 0.65;

// Нижче цієї ширини (px) — телефон: АКМ по центру, без бокового зсуву, і ×2 більший.
const MOBILE_MAX_WIDTH = 600;
const MOBILE_SIZE_MUL = 2;
// На мобайлі у Features довертаємо всю розбирку у вертикальніший вигляд (екран вузький, а
// висоти багато). Трохи менше за 90° — динамічніше. У CTA roll = 0 (горизонталь, без змін).
const FEATURES_MOBILE_ROLL = (80 * Math.PI) / 180;

// Еталонний кадр (як у ScenePage): розмір моделі підібрано під 1920×1080 і масштабується
// коефіцієнтом min(1, w/1920, h/1080) — на 1920 як задизайнено, нижче плавно меншає за
// меншим виміром. REF_SLOT — розміри слот-боксів на еталоні (px), під них рахується базовий
// масштаб (незалежно від того, як CSS змінює бокс на менших екранах). DOM-бокс дає лише центр.
const REF = { width: 1920, height: 1080 };
const REF_SLOT: Record<AkmSlotKey, { w: number; h: number }> = {
  features: { w: 332, h: 920 },
  cta: { w: 940, h: 340 },
};

const SLOT: Record<AkmSlotKey, { scaleMult: number; offsetXFrac: number }> = {
  features: { scaleMult: 3.5, offsetXFrac: 0.12 },
  cta: { scaleMult: 1.9, offsetXFrac: 0 },
};

type Placement = { x: number; y: number; scale: number };

const AkmModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const root = useRef<Group>(null);
  const model = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, model);
  const { camera, size } = useThree();

  const projected = useMemo(() => new Vector3(), []);

  // Центр моделі (для рецентрування) + її екранний слід у позі FACING (для contain-фіту).
  const geometry = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const pivot = box.getCenter(new Vector3());

    const facing = new Euler(...FACING);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const corner = new Vector3(
            x - pivot.x,
            y - pivot.y,
            z - pivot.z,
          ).applyEuler(facing);
          minX = Math.min(minX, corner.x);
          maxX = Math.max(maxX, corner.x);
          minY = Math.min(minY, corner.y);
          maxY = Math.max(maxY, corner.y);
        }
      }
    }
    return { pivot, footprint: { w: maxX - minX || 1, h: maxY - minY || 1 } };
  }, [scene]);

  // Пом'якшуємо метал на матеріалах моделі.
  useEffect(() => {
    tuneMaterials(scene, {
      envMapIntensity: ENV_MAP_INTENSITY,
      minRoughness: MIN_ROUGHNESS,
    });
  }, [scene]);

  // idle — циклічно; diassemble/assemble — скрабимо (ставимо час кадру вручну за прогресом).
  const playClip = (clip: AkmClip, scrub: number, delta: number) => {
    const action = actions[clip];
    if (!action) return;

    for (const name in actions) {
      const other = actions[name];
      if (other && other !== action) other.stop();
    }

    if (clip === "idle") {
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.paused = false;
      if (!action.isRunning()) action.reset().play();
      mixer.update(delta);
    } else {
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.enabled = true;
      action.paused = true;
      action.play();
      action.time = clamp01(scrub) * action.getClip().duration;
      mixer.update(0);
    }
  };

  // Позиція (центр живого DOM-бокса) + масштаб від еталона × коефіцієнт вписування.
  // null, якщо DOM-бокс відсутній.
  const placeInSlot = (
    slot: AkmSlotKey,
    worldPerPx: number,
    worldPerPxRef: number,
    viewportFit: number,
  ): Placement | null => {
    const element = document.getElementById(AKM_SLOT_ID[slot]);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const { scaleMult, offsetXFrac } = SLOT[slot];
    const ref = REF_SLOT[slot];
    const isMobile = size.width <= MOBILE_MAX_WIDTH;
    const shiftX = isMobile ? 0 : offsetXFrac;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Базовий масштаб — вписування моделі в еталонний бокс (у px на 1920×1080).
    const baseScale =
      Math.min(
        (ref.w * worldPerPxRef) / geometry.footprint.w,
        (ref.h * worldPerPxRef) / geometry.footprint.h,
      ) * scaleMult;
    const mobileMul = isMobile ? MOBILE_SIZE_MUL : 1;

    return {
      x:
        (centerX - size.width / 2) * worldPerPx +
        shiftX * size.width * worldPerPx,
      y: (size.height / 2 - centerY) * worldPerPx,
      scale: baseScale * viewportFit * mobileMul,
    };
  };

  useFrame((_, delta) => {
    const group = root.current;
    if (!group) return;

    const choreo = choreoRef.current;
    if (!choreo.akmVisible) {
      group.visible = false;
      return;
    }

    const camera3d = camera as PerspectiveCamera;
    const viewSpan = 2 * Math.tan((camera3d.fov * Math.PI) / 180 / 2) * camera3d.position.z;
    const worldPerPx = viewSpan / size.height;
    const worldPerPxRef = viewSpan / REF.height;
    const viewportFit = Math.min(
      1,
      size.width / REF.width,
      size.height / REF.height,
    );

    const fromFeatures = placeInSlot("features", worldPerPx, worldPerPxRef, viewportFit);
    const toCta = placeInSlot("cta", worldPerPx, worldPerPxRef, viewportFit);
    const flight = smoothstep(clamp01(choreo.akmFlow));

    let placement: Placement | null;
    if (fromFeatures && toCta) {
      placement = {
        x: lerp(fromFeatures.x, toCta.x, flight),
        y: lerp(fromFeatures.y, toCta.y, flight),
        scale: lerp(fromFeatures.scale, toCta.scale, flight),
      };
    } else {
      placement = fromFeatures ?? toCta;
    }
    if (!placement) {
      group.visible = false;
      return;
    }

    // Поза «інспекції» у Features → рівна горизонталь у CTA (по мірі перельоту).
    // На мобайлі у Features додаємо екранний roll (вертикальніше); зникає при перельоті в CTA.
    const isMobile = size.width <= MOBILE_MAX_WIDTH;
    const roll = isMobile ? lerp(FEATURES_MOBILE_ROLL, 0, flight) : 0;
    group.position.set(placement.x, placement.y, 0);
    group.scale.setScalar(placement.scale);
    group.rotation.set(
      lerp(choreo.akmPitch, 0, flight),
      lerp(choreo.akmYaw, 0, flight),
      roll,
      isMobile ? "ZYX" : "XYZ",
    );

    // Показуємо лише коли модель реально у в'юпорті (щоб було видно переліт).
    projected.copy(group.position).project(camera3d);
    group.visible =
      Math.abs(projected.x) < 1.5 &&
      Math.abs(projected.y) < 1.5 &&
      projected.z < 1;

    playClip(choreo.akmClip, choreo.akmScrub, delta);
  });

  return (
    <group ref={root} visible={false}>
      <group ref={model} rotation={FACING}>
        <primitive
          object={scene}
          position={[-geometry.pivot.x, -geometry.pivot.y, -geometry.pivot.z]}
        />
      </group>
    </group>
  );
};

export default AkmModel;
