import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./nadom-claude-design.css";
import "./nadom-visual-polish.css";
import { applyBrowserPreviewTheme } from "./theme-preview";

applyBrowserPreviewTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
