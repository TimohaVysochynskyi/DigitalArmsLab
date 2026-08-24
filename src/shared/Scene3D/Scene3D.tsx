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
import { ACESFilmicToneMapping, Mesh, type Texture } from "three";
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

/* Прогрів GPU поза кадром.

   Без нього шейдер-програми й текстури важкої моделі (АКМ) компілювались і вивантажувались
   на GPU СИНХРОННО на першому кадрі її появи у Features — це давало заморозку близько секунди
   (дрон стрибав зі скролом, АКМ з'являвся лише після). Тут одноразово, у простої (коли Hero
   вже намальовано), компілюємо всі програми сцени через compileAsync (він спирається на
   KHR_parallel_shader_compile, тож не блокує головний потік) і вивантажуємо текстури через
   initTexture. Коли глядач доскролює до Features, робити на гарячому кадрі вже нічого. */
const TEXTURE_SLOTS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
] as const;

const SceneWarmup = () => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let cancelled = false;

    const warm = async () => {
      // Компіляція програм — паралельна й неблокуюча; без неї це стається в кадрі появи.
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        // Прогрів не критичний: навіть без нього сцена працює, лише з разовим лагом.
      }
      if (cancelled) return;

      // Аплоад текстур на GPU наперед, щоб і він не ліг на перший кадр моделі.
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const material of materials) {
          const slots = material as unknown as Record<string, Texture | null>;
          for (const slot of TEXTURE_SLOTS) {
            const texture = slots[slot];
            if (texture?.isTexture) gl.initTexture(texture);
          }
        }
      });
      invalidate();
    };

    const request = window.requestIdleCallback;
    if (!request) {
      const timer = window.setTimeout(warm, 200);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    const handle = request(() => warm(), { timeout: 2000 });
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(handle);
    };
  }, [gl, scene, camera, invalidate]);

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
          {/* Прогрів шейдерів/текстур у простої — після того, як діти (моделі) завантажені. */}
          <SceneWarmup />
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default Scene3D;
