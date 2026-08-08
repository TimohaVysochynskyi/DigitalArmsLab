/* Студійне освітлення, спільне для всіх сцен проєкту: м'яке загальне + теплий key +
   холодний fill, IBL через <Environment> з Lightformer'ами (без зовнішнього HDRI-файлу) —
   дає відблиски металу й відображення в склі камери дрона. */

import { Environment, Lightformer } from "@react-three/drei";

const StudioEnvironment = () => {
  return (
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
};

export default StudioEnvironment;
