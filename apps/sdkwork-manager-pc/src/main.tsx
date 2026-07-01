import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ManagerPcApp } from "@sdkwork/manager-pc-shell";

import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ManagerPcApp />
  </StrictMode>,
);
