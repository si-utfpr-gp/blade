import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

document.addEventListener("turbo:load", () => {
  const root = document.getElementById("builder");

  if (!root) return;

  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});