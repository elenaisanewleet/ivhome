import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { applyBrowserPreviewTheme } from "./theme-preview";
import "./dashboard-v8.css";

applyBrowserPreviewTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
