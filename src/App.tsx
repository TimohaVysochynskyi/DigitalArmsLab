import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./widgets";

const HomePage = lazy(() => import("./pages/HomePage"));
const LaboratoryPage = lazy(() => import("./pages/LaboratoryPage"));
const ScenePage = lazy(() => import("./pages/ScenePage"));

const App = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lab" element={<LaboratoryPage />} />
            <Route path="/lab/:weaponId" element={<ScenePage />} />
          </Routes>
        </Layout>
      </Suspense>
    </>
  );
};

export default App;
