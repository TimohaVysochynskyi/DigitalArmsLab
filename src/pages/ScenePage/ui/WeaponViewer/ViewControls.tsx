/* Орбіта мишею/пальцем + зум колесом. Скидання виду — не стрибком, а плавним перельотом
   у сферичних координатах (радіус/нахил/азимут), тож камера повертається по дузі. */

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Spherical, Vector3 } from "three";
import {
  AUTO_ROTATE_SPEED,
  CAMERA_FOV,
  DEFAULT_ORBIT,
  FRAME_FILL,
  POLAR_LIMITS,
  RESET_DURATION,
  ZOOM_LIMITS,
} from "./viewer.config";
import {
  easeInOutCubic,
  fitDistance,
  shortestAngle,
  type ModelProjection,
} from "./viewer.math";

type ViewControlsProps = {
  autoRotate: boolean;
  /** Змінюється щоразу, коли треба повернутись до дефолтного виду. */
  resetSignal: number;
  /** Обмір моделі; поки null — кадрування ще не рахуємо. */
  projection: ModelProjection | null;
};

type ResetState = {
  time: number;
  from: Spherical;
  fromTarget: Vector3;
};

const ViewControls = ({
  autoRotate,
  resetSignal,
  projection,
}: ViewControlsProps) => {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const reset = useRef<ResetState | null>(null);
  const currentFit = useRef(0);
  const { camera, size } = useThree();

  const scratch = useMemo(() => new Spherical(), []);

  /* Дистанція, з якої модель вписується в поточний канвас: рахується з її реальних
     габаритів у стартовому ракурсі + аспекту канваса, тож вужчий екран сам віддаляє
     камеру, а не ріже модель. */
  const fit = useMemo(
    () =>
      projection
        ? fitDistance(
            projection,
            CAMERA_FOV,
            size.width / size.height,
            FRAME_FILL,
          )
        : 0,
    [projection, size.width, size.height],
  );

  // Первинне кадрування; при зміні розміру в'юпорта — зберігаємо відносний зум.
  // Саме layout-ефект: камера має стати на місце до першого кадру з моделлю.
  useLayoutEffect(() => {
    const control = controls.current;
    if (!control || !fit) return;

    const previousFit = currentFit.current;
    currentFit.current = fit;

    control.minDistance = fit * ZOOM_LIMITS.min;
    control.maxDistance = fit * ZOOM_LIMITS.max;

    if (previousFit) {
      const offset = camera.position.clone().sub(control.target);
      camera.position
        .copy(control.target)
        .add(offset.multiplyScalar(fit / previousFit));
    } else {
      camera.position.setFromSpherical(
        scratch.set(fit, DEFAULT_ORBIT.phi, DEFAULT_ORBIT.theta),
      );
      control.target.set(0, 0, 0);
    }

    control.update();
  }, [fit, camera, scratch]);

  useEffect(() => {
    const control = controls.current;
    if (!resetSignal || !control) return;

    reset.current = {
      time: 0,
      from: new Spherical().setFromVector3(
        camera.position.clone().sub(control.target),
      ),
      fromTarget: control.target.clone(),
    };
    control.enabled = false;
  }, [resetSignal, camera]);

  useFrame((_, delta) => {
    const control = controls.current;
    if (!control) return;

    const state = reset.current;
    control.autoRotate = autoRotate && !state;
    if (!state) return;

    state.time = Math.min(1, state.time + delta / RESET_DURATION);
    const progress = easeInOutCubic(state.time);

    control.target.copy(state.fromTarget).multiplyScalar(1 - progress);
    camera.position
      .setFromSpherical(
        scratch.set(
          state.from.radius +
            (currentFit.current - state.from.radius) * progress,
          state.from.phi + (DEFAULT_ORBIT.phi - state.from.phi) * progress,
          state.from.theta +
            shortestAngle(state.from.theta, DEFAULT_ORBIT.theta) * progress,
        ),
      )
      .add(control.target);
    control.update();

    if (state.time >= 1) {
      reset.current = null;
      control.enabled = true;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={0.7}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      minPolarAngle={POLAR_LIMITS.min}
      maxPolarAngle={POLAR_LIMITS.max}
    />
  );
};

export default ViewControls;
