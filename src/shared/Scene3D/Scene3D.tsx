/* Переюзний контейнер для 3D: єдиний fixed-overlay <Canvas> на всю сторінку.

   Z-шар (контракт, back → front):
     фонове медіа секцій (напр. hero <video>)  z-index: -2 і нижче
     ЦЕЙ канвас                                 z-index: -1
     VisionScanner (ефект курсора)              z-index: 0
     контент/текст секцій                       z-index: 1 і вище
   Секції-хости не мають створювати stacking context (без transform / opacity<1 /
   isolation / filter), інакше шарування зламається.

   Канвас прозорий (alpha) і pointer-events:none.

   ПОСТОБРОБКИ ТУТ НЕМАЄ — і додавати її не варто. EffectComposer з Bloom подвоював
   вартість кадру (16.6 → 26+ мс на реальній GPU), тобто не вміщувався в бюджет 60 Гц:
   скрол просідав до ~18 fps зі стрибками під 100 мс. Це не питання налаштувань —
   заміряно MSAA 0, dpr 1 і півроздільну bloom, усі варіанти лишились за межею бюджету,
   бо повноекранний mip-ланцюг коштує стільки, скільки коштує.
   Гарячий кант на моделях дає контрове СВІТЛО (StudioEnvironment → showcase), а ореол
   навколо них — дешевий CSS-градієнт у розмітці секції.

   Повнокадрові ефекти (віньєтка, зерно) сюди теж не ставимо — вони мають лягати на всю
   сторінку, а не лише на 3D-шар; для них є shared/ScreenGrade. */

import { Suspense, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import StudioEnvironment, { type LightingPreset } from "./StudioEnvironment";
import css from "./Scene3D.module.css";

/* Стеля dpr. 2 означає вчетверо більше пікселів, ніж 1 — на Retina/4K це помітний
   шматок бюджету заради різниці, якої на фоновому декоративному шарі майже не видно. */
const MAX_PIXEL_RATIO = 1.5;

type Scene3DProps = {
  children?: ReactNode;
  /** Характер освітлення сцени (див. StudioEnvironment). */
  lighting?: LightingPreset;
  /* Чи малювати кадри. Хто саме це вирішує — не справа контейнера; він лише вимикає
     цикл рендера. ВАЖЛИВО: зупинений цикл лишає на канвасі останній кадр, тож вимикати
     можна тільки тоді, коли в ньому вже нічого немає (див. useSceneActivity). */
  active?: boolean;
};

/* Керує тим, чи малюються кадри.

   Канвас працює в режимі `demand`: сам він не малює нічого, кадр з'являється лише на
   явний запит. Поки сцена активна, ми ведемо власний цикл запитів; щойно неактивна —
   просто перестаємо просити, і рендер зупиняється повністю.

   Чому не проп `frameloop`: у <Canvas> він читається лише при монтуванні, і його зміна
   в рантаймі до рендерера не доходить (перевірено: статичний `never` дає нуль малювань,
   а перемикання пропа не змінює нічого). */
const FrameloopGate = ({ active }: { active: boolean }) => {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!active) return;

    let frame = requestAnimationFrame(function tick() {
      invalidate();
      frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [active, invalidate]);

  return null;
};

const Scene3D = ({
  children,
  lighting = "showcase",
  active = true,
}: Scene3DProps) => {
  return (
    <div className={css.layer} aria-hidden="true">
      <Canvas
        className={css.canvas}
        frameloop="demand"
        dpr={[1, MAX_PIXEL_RATIO]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          // Нижча за нейтральну — щоб чорне лишалось чорним, а світився лише кант.
          gl.toneMappingExposure = 0.95;
        }}
      >
        <FrameloopGate active={active} />

        <Suspense fallback={null}>
          <StudioEnvironment preset={lighting} />
          {children}
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default Scene3D;
