import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./widgets";

const HomePage = lazy(() => import("./pages/HomePage"));

const App = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Layout>
      </Suspense>
    </>
  );
};

export default App;
