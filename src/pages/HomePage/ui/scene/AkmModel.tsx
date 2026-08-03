/* eslint-disable react-hooks/immutability --
   керування анімаціями three.js — це імперативне мутування AnimationAction/mixer
   (штатний патерн three, а не React-стан), тож правило незастосовне тут. */

/* АКМ: одна модель. Позиція — це blend між DOM-боксами двох слотів за choreo.akmFlow:
     flow = 0 → бокс Features; flow = 1 → бокс CTA.
   Під час Features flow=0 (стоїть у боксі, скраб кліпів); у проміжку flow 0→1 — scroll-driven
   переліт (як у дрона); у CTA flow=1 (точно на боксі, без смикання).

   Оберт: facing (inner) — профіль до глядача; rollZ (outer, площина екрана) — як CSS rotate().
   Дефолт моделі: ствол уперед / приклад до глядача → facing Y = -π/2 робить профіль. */

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import {
  Box3,
  Vector3,
  Euler,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  LoopOnce,
  LoopRepeat,
} from "three";
import type { AkmClip, AkmSlotKey, Choreo } from "./types";
import { AKM_SLOT_ID } from "./types";

const MODEL_URL = "/models/akm.glb";
useGLTF.preload(MODEL_URL);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Орієнтація моделі однакова для обох слотів (профіль). facing[1]=-π/2 — знак фліпає бік/ствол.
const FACING: [number, number, number] = [0, -Math.PI / 2, 0];

// Приглушення металевого блиску: менша сила відбиття envMap + мінімальна шорсткість.
const REFLECTION = { envMapIntensity: 0.6, minRoughness: 0.4 };

type SlotTune = {
  /** Screen-roll для розрахунку contain-габаритів (репрезентативний кут). */
  rollZ: number;
  scaleMult: number;
  /** Зсув по X (частка ширини в'юпорту, + = праворуч). */
  offsetXFrac: number;
};

// TUNE. Features rollZ тут — лише для фіту (реальний оберт керується choreo.akmRollZ покроково).
const SLOT_TUNE: Record<AkmSlotKey, SlotTune> = {
  features: { rollZ: -Math.PI / 12, scaleMult: 3.5, offsetXFrac: 0.12 },
  cta: { rollZ: 0, scaleMult: 1.9, offsetXFrac: 0 },
};

type Target = { x: number; y: number; scale: number };

const AkmModel = ({ choreoRef }: { choreoRef: RefObject<Choreo> }) => {
  const group = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, inner);
  const { camera, size } = useThree();

  const ndc = useMemo(() => new Vector3(), []);

  const base = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    box.getCenter(center);
    return { box, center };
  }, [scene]);

  // Приглушуємо надто «дешевий» металевий блиск на матеріалах АКМ.
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const mat = m as MeshStandardMaterial;
        if ("envMapIntensity" in mat) mat.envMapIntensity = REFLECTION.envMapIntensity;
        if ("roughness" in mat && mat.roughness < REFLECTION.minRoughness) {
          mat.roughness = REFLECTION.minRoughness;
        }
      }
    });
  }, [scene]);

  // Екранні габарити моделі під кожен слот (FACING + rollZ) — для contain-фіту.
  const extents = useMemo(() => {
    const { min, max } = base.box;
    const c = base.center;
    const corners = [
      [min.x, min.y, min.z],
      [max.x, min.y, min.z],
      [min.x, max.y, min.z],
      [max.x, max.y, min.z],
      [min.x, min.y, max.z],
      [max.x, min.y, max.z],
      [min.x, max.y, max.z],
      [max.x, max.y, max.z],
    ];
    const calc = (rollZ: number) => {
      const fe = new Euler(FACING[0], FACING[1], FACING[2]);
      const ze = new Euler(0, 0, rollZ);
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const [x, y, z] of corners) {
        const v = new Vector3(x - c.x, y - c.y, z - c.z)
          .applyEuler(fe)
          .applyEuler(ze);
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      }
      return { w: maxX - minX || 1, h: maxY - minY || 1 };
    };
    return {
      features: calc(SLOT_TUNE.features.rollZ),
      cta: calc(SLOT_TUNE.cta.rollZ),
    };
  }, [base]);

  const applyClip = (clip: AkmClip, scrub: number, delta: number) => {
    const target = actions[clip];
    if (!target) return;

    for (const name in actions) {
      const a = actions[name];
      if (a && a !== target) a.stop();
    }

    if (clip === "idle") {
      target.setLoop(LoopRepeat, Infinity);
      target.clampWhenFinished = false;
      target.paused = false;
      if (!target.isRunning()) target.reset().play();
      mixer.update(delta);
    } else {
      target.setLoop(LoopOnce, 1);
      target.clampWhenFinished = true;
      target.enabled = true;
      target.play();
      target.paused = true;
      target.time = Math.max(0, Math.min(1, scrub)) * target.getClip().duration;
      mixer.update(0);
    }
  };

  useFrame((_, delta) => {
    const g = group.current;
    const inr = inner.current;
    if (!g || !inr) return;

    const c = choreoRef.current;
    if (!c.akmVisible) {
      g.visible = false;
      return;
    }

    const cam = camera as PerspectiveCamera;
    const worldPerPx =
      (2 * Math.tan((cam.fov * Math.PI) / 180 / 2) * cam.position.z) /
      size.height;

    const slotTarget = (slot: AkmSlotKey): Target | null => {
      const el = document.getElementById(AKM_SLOT_ID[slot]);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const tune = SLOT_TUNE[slot];
      const ext = extents[slot];
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // На телефоні (≤600px) offset = 0 → АКМ по центру по горизонталі.
      const offX = size.width > 600 ? tune.offsetXFrac : 0;
      return {
        x: (cx - size.width / 2) * worldPerPx + offX * size.width * worldPerPx,
        y: (size.height / 2 - cy) * worldPerPx,
        scale:
          Math.min(
            (r.width * worldPerPx) / ext.w,
            (r.height * worldPerPx) / ext.h,
          ) * tune.scaleMult,
      };
    };

    const fT = slotTarget("features");
    const cT = slotTarget("cta");
    const flow = clamp01(c.akmFlow);
    const e = smooth(flow);

    // Орієнтація: у Features керується покроково (yaw/pitch/roll), при перельоті → до CTA (0,0,0).
    const yaw = lerp(c.akmYaw, 0, e);
    const pitch = lerp(c.akmPitch, 0, e);
    const roll = lerp(c.akmRollZ, 0, e);

    let t: Target;
    if (fT && cT) {
      t = {
        x: lerp(fT.x, cT.x, e),
        y: lerp(fT.y, cT.y, e),
        scale: lerp(fT.scale, cT.scale, e),
      };
    } else {
      const only = fT ?? cT;
      if (!only) {
        g.visible = false;
        return;
      }
      t = only;
    }

    inr.rotation.set(FACING[0], FACING[1], FACING[2]);
    g.position.set(t.x, t.y, 0);
    g.scale.setScalar(t.scale);
    g.rotation.set(pitch, yaw, roll);

    // Видимість — за фактичною екранною позицією (щоб було видно переліт).
    ndc.copy(g.position).project(cam);
    g.visible = Math.abs(ndc.x) < 1.5 && Math.abs(ndc.y) < 1.5 && ndc.z < 1;

    applyClip(c.akmClip, c.akmScrub, delta);
  });

  return (
    <group ref={group} visible={false}>
      <group ref={inner}>
        <primitive
          object={scene}
          position={[-base.center.x, -base.center.y, -base.center.z]}
        />
      </group>
    </group>
  );
};

export default AkmModel;
