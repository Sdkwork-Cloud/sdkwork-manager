import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SdkworkSessionAuthBrowserRoot } from "@sdkwork/auth-pc-react";

import { ManagerAuthRoutes } from "./auth/ManagerAuthRoutes";
import { RequireOperatorSession } from "./auth/RequireOperatorSession";
import { ManagerAppShell } from "./manager-app-shell";

export function ManagerPcApp() {
  return (
    <BrowserRouter>
      <SdkworkSessionAuthBrowserRoot authLoginPath="/auth/login">
        <Routes>
          <Route element={<ManagerAuthRoutes />} path="/auth/*" />
          <Route
            element={
              <RequireOperatorSession>
                <ManagerAppShell />
              </RequireOperatorSession>
            }
            path="/*"
          />
        </Routes>
      </SdkworkSessionAuthBrowserRoot>
    </BrowserRouter>
  );
}

export { ManagerAppShell } from "./manager-app-shell";
