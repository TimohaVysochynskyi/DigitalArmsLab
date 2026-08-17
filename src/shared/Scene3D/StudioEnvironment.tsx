/* Освітлення сцен проєкту. Два пресети під різні задачі:

   study (дефолт) — рівне студійне світло для ScenePage: об'єкт треба РОЗДИВЛЯТИСЯ,
     тож жодних глибоких тіней, деталь читається з будь-якого ракурсу.

   showcase — кінематографічне світло для лендінгу: майже чорний ґрунт, гарячий
     помаранчевий контровий кант по силуету і слабкий холодний заповнювач спереду.
     Об'єкт «виходить із темряви» і світиться тим самим помаранчем, що й сторінка,
     тобто виглядає частиною кадру, а не каталожним рендером поверх нього.

   IBL — через <Environment> з Lightformer'ами (без зовнішнього HDRI-файлу): дає
   відблиски металу й відображення в склі камери дрона. */

import { Environment, Lightformer } from "@react-three/drei";

export type LightingPreset = "study" | "showcase";

type StudioEnvironmentProps = {
  preset?: LightingPreset;
};

const StudyLighting = () => (
  <>
    <ambientLight intensity={0.7} />
    <directionalLight position={[5, 8, 6]} intensity={1.3} color="#fff4ea" />
    <directionalLight position={[-6, 3, -3]} intensity={0.5} color="#e2ecff" />

    <Environment resolution={256}>
      <Lightformer
        form="rect"
        intensity={1.4}
        position={[0, 6, 4]}
        scale={[14, 8, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#ffffff"
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        position={[7, 2, 3]}
        scale={[5, 10, 1]}
        color="#fff3e8"
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        position={[-7, 2, 3]}
        scale={[5, 10, 1]}
        color="#eaf1ff"
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[0, 1, -7]}
        scale={[12, 7, 1]}
        color="#ffffff"
      />
    </Environment>
  </>
);

const ShowcaseLighting = () => (
  <>
    {/* Ambient майже прибрано: неосвітлений бік має йти в темряву — саме контраст
        дає об'єкту вагу. Лишаємо стільки, щоб тінь не стала мертвим чорним. */}
    <ambientLight intensity={0.16} />

    {/* Контрове світло — головний прийом. Ззаду-справа, у брендовому помаранчі:
        малює гарячий кант по силуету й відділяє модель від чорного фону. */}
    <directionalLight position={[7, 3, -6]} intensity={3.6} color="#ff7a3c" />
    {/* Другий кант, слабший і холодний — щоб модель не стала суцільно помаранчевою. */}
    <directionalLight position={[-6, 2, -5]} intensity={1.1} color="#dbdbdb" />

    {/* Заповнювач спереду: тримає корпус читабельним, але не претендує на головного.
        Нижче — і тіньовий бік провалюється в суцільний чорний, деталь зникає. */}
    <directionalLight position={[-3, 4, 7]} intensity={1} color="#cfd8e8" />

    <Environment resolution={256}>
      {/* Загальний блиск зверху — темний, лише щоб метал не був плоским. */}
      <Lightformer
        form="rect"
        intensity={0.4}
        position={[0, 6, 2]}
        scale={[12, 8, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#5a5a5a"
      />
      {/* Помаранчеве джерело ззаду — те, що видно у відображеннях металу та скла. */}
      <Lightformer
        form="rect"
        intensity={3}
        position={[6, 1, -5]}
        scale={[7, 6, 1]}
        color="#ff8a4c"
      />
      {/* Холодний натяк спереду-зліва. */}
      <Lightformer
        form="rect"
        intensity={0.55}
        position={[-6, 1, 4]}
        scale={[5, 8, 1]}
        color="#c8d2e2"
      />
    </Environment>
  </>
);

const StudioEnvironment = ({ preset = "study" }: StudioEnvironmentProps) => {
  return preset === "showcase" ? <ShowcaseLighting /> : <StudyLighting />;
};

export default StudioEnvironment;
