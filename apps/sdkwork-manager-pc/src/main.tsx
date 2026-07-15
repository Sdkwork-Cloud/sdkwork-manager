import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ManagerPcApp } from "@sdkwork/manager-pc-shell";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";

import { createManagerAdminModuleAssembly } from "./bootstrap/adminModuleAssembly";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SdkworkThemeProvider defaultTheme="light" locale="zh-CN" themeColor="green-tech">
      <ManagerPcApp modules={createManagerAdminModuleAssembly()} />
    </SdkworkThemeProvider>
  </StrictMode>,
);
