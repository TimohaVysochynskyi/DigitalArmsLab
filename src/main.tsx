import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { hideAppLoader } from "./shared/lib/appLoader";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Страховка: якщо сцена так і не повідомила про готовність (напр. помилка мережі при
// завантаженні three.js), стартовий лоадер усе одно приберемо, щоб не завис назавжди.
window.setTimeout(hideAppLoader, 15000);
