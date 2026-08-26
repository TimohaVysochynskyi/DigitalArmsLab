/* eslint-disable react-hooks/immutability --
   керування AnimationAction/mixer — імперативне мутування (штатний патерн three). */

/* Модель однієї одиниці: нормалізується до MODEL_RADIUS і центрується в початку координат,
   тож камера кадрує будь-який glb однаково. Тогл розбирання програє кліп один раз і
   лишає модель у кінцевій позі. */

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useAnimations } from "@react-three/drei";
import { Box3, Group, LoopOnce, Sphere, Vector3 } from "three";
import { useGltfModel, useTunedMaterials } from "@/shared/Scene3D";
import {
  ASSEMBLY_CLIPS,
  DEFAULT_ORBIT,
  MODEL_FACING,
  MODEL_RADIUS,
} from "./viewer.config";
import {
  orbitDirection,
  projectVertices,
  type ModelProjection,
} from "./viewer.math";

/* Матеріали стриманіші за лендінгові: тут модель роздивляються зблизька, тож рельєф і
   відбиття гасимо лише настільки, щоб прибрати мерехтіння блиску, не з'їдаючи деталь. */
const MATERIALS = { envMapIntensity: 0.5, normalScale: 0.9, roughnessBoost: 1.1 };

const NO_FACING: [number, number, number] = [0, 0, 0];
const FADE = 0.2;

type WeaponModelProps = {
  url: string;
  isDisassembled: boolean;
  onAssemblyAvailable: (isAvailable: boolean) => void;
  /** Обмір зібраної моделі у стартовому ракурсі — за ним камера кадрує сцену. */
  onMeasure: (projection: ModelProjection) => void;
};

const findClip = (names: string[], variants: string[]) =>
  names.find((name) => variants.includes(name.trim().toLowerCase()));

const WeaponModel = ({
  url,
  isDisassembled,
  onAssemblyAvailable,
  onMeasure,
}: WeaponModelProps) => {
  const root = useRef<Group>(null);
  const { scene, animations } = useGltfModel(url);
  const { actions } = useAnimations(animations, root);
  const isFirstPose = useRef(true);

  const fit = useMemo(() => {
    const sphere = new Box3()
      .setFromObject(scene)
      .getBoundingSphere(new Sphere());

    return {
      scale: MODEL_RADIUS / (sphere.radius || 1),
      offset: sphere.center.clone().multiplyScalar(-1) as Vector3,
    };
  }, [scene]);

  const clips = useMemo(() => {
    const names = animations.map((clip) => clip.name);

    return {
      disassemble: findClip(names, ASSEMBLY_CLIPS.disassemble),
      assemble: findClip(names, ASSEMBLY_CLIPS.assemble),
    };
  }, [animations]);

  useTunedMaterials(scene, MATERIALS);

  useEffect(() => {
    onAssemblyAvailable(Boolean(clips.disassemble));
  }, [clips, onAssemblyAvailable]);

  // Міряємо у зібраній позі, до старту будь-якого кліпу.
  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;

    onMeasure(
      projectVertices(
        group,
        orbitDirection(DEFAULT_ORBIT.phi, DEFAULT_ORBIT.theta),
      ),
    );
  }, [scene, fit, onMeasure]);

  useEffect(() => {
    if (isFirstPose.current) {
      isFirstPose.current = false;
      return;
    }

    // Немає окремого кліпу збирання — програємо розбирання у зворотному напрямку.
    const name = isDisassembled
      ? clips.disassemble
      : (clips.assemble ?? clips.disassemble);
    const action = name ? actions[name] : null;
    if (!action) return;

    for (const key in actions) {
      if (key !== name) actions[key]?.fadeOut(FADE);
    }

    const isReversed = !isDisassembled && !clips.assemble;
    const duration = action.getClip().duration;

    action.reset();
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = isReversed ? -1 : 1;
    action.time = isReversed ? duration : 0;
    action.fadeIn(FADE).play();
  }, [isDisassembled, actions, clips]);

  return (
    <group ref={root} scale={fit.scale}>
      <group rotation={MODEL_FACING[url] ?? NO_FACING}>
        <primitive object={scene} position={fit.offset} />
      </group>
    </group>
  );
};

export default WeaponModel;
