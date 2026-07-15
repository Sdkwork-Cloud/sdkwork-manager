import { useMemo } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { SdkworkSessionAuthBrowserRoot } from "@sdkwork/auth-pc-react";
import {
  clearManagerIamSession,
  createAdminModuleAccessScope,
  getManagerCommercialEntitlementKeys,
  getManagerIamRuntime,
  getManagerPermissionScope,
  resolveManagerAuthAppearance,
  resetManagerIamRuntime,
  resetOperatorTokenManager,
  type AdminModuleContribution,
} from "@sdkwork/manager-pc-core";
import { createSdkworkCoreHostRegistry } from "@sdkwork/manager-pc-core";

import { AdminHostShell } from "./admin-host-shell";
import { ManagerAuthRoutes } from "./auth/ManagerAuthRoutes";
import { ManagerAuthenticatedAuthRouteGuard } from "./auth/ManagerAuthenticatedAuthRouteGuard";
import { RequireOperatorSession } from "./auth/RequireOperatorSession";
import { useManagerAuthRuntimeConfig } from "./auth/useManagerAuthRuntimeConfig";

function ProtectedAdminHost({ modules }: { modules: readonly AdminModuleContribution[] }) {
  const navigate = useNavigate();
  const registry = useMemo(() => createSdkworkCoreHostRegistry(modules), [modules]);
  const accessScope = useMemo(
    () => createAdminModuleAccessScope({
      entitlementKeys: getManagerCommercialEntitlementKeys(),
      permissionScope: getManagerPermissionScope(),
    }),
    [],
  );

  const signOut = async () => {
    try {
      await getManagerIamRuntime().service.auth.sessions.current.delete();
    } finally {
      clearManagerIamSession();
      resetOperatorTokenManager();
      resetManagerIamRuntime();
      navigate("/auth/login", { replace: true });
    }
  };

  return <AdminHostShell accessScope={accessScope} onSignOut={signOut} registry={registry} />;
}

function ProtectedAdminArea({
  modules,
  runtimeConfig,
}: {
  modules: readonly AdminModuleContribution[];
  runtimeConfig: Parameters<typeof SdkworkSessionAuthBrowserRoot>[0]["runtimeConfig"];
}) {
  return (
    <SdkworkSessionAuthBrowserRoot
      appearance={resolveManagerAuthAppearance()}
      authLoginPath="/auth/login"
      getRuntime={getManagerIamRuntime}
      homePath="/"
      locale="zh-CN"
      runtimeConfig={runtimeConfig}
    >
      <RequireOperatorSession>
        <ProtectedAdminHost modules={modules} />
      </RequireOperatorSession>
    </SdkworkSessionAuthBrowserRoot>
  );
}

export function ManagerPcApp({ modules }: { modules: readonly AdminModuleContribution[] }) {
  const runtimeConfig = useManagerAuthRuntimeConfig();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ManagerAuthenticatedAuthRouteGuard>
              <ManagerAuthRoutes authRuntime={runtimeConfig} />
            </ManagerAuthenticatedAuthRouteGuard>
          }
          path="/auth/*"
        />
        <Route
          element={<ProtectedAdminArea modules={modules} runtimeConfig={runtimeConfig.runtimeConfig} />}
          path="/*"
        />
      </Routes>
    </BrowserRouter>
  );
}

export { AdminHostIntegrationPage } from "./admin-host-shell";
