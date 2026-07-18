import { useMemo } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { SdkworkSessionAuthBrowserRoot } from "@sdkwork/auth-pc-react";
import {
  clearManagerIamSession,
  createAdminModuleAccessScope,
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

type ManagerPcAppProps = {
  locale: string;
  modules: readonly AdminModuleContribution[];
  onLocaleChange: (locale: string) => void;
};

function ProtectedAdminHost({
  locale,
  modules,
  onLocaleChange,
}: ManagerPcAppProps) {
  const navigate = useNavigate();
  const registry = useMemo(() => createSdkworkCoreHostRegistry(modules), [modules]);

  const accessScope = useMemo(
    () => createAdminModuleAccessScope({
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

  return (
    <AdminHostShell
      accessScope={accessScope}
      locale={locale}
      onLocaleChange={onLocaleChange}
      onSignOut={signOut}
      registry={registry}
    />
  );
}

function ProtectedAdminArea({
  modules,
  locale,
  onLocaleChange,
  runtimeConfig,
}: {
  locale: string;
  modules: readonly AdminModuleContribution[];
  onLocaleChange: (locale: string) => void;
  runtimeConfig: Parameters<typeof SdkworkSessionAuthBrowserRoot>[0]["runtimeConfig"];
}) {
  return (
    <SdkworkSessionAuthBrowserRoot
      appearance={resolveManagerAuthAppearance()}
      authLoginPath="/auth/login"
      getRuntime={getManagerIamRuntime}
      homePath="/"
      locale={locale}
      runtimeConfig={runtimeConfig}
    >
      <RequireOperatorSession>
        <ProtectedAdminHost
          locale={locale}
          modules={modules}
          onLocaleChange={onLocaleChange}
        />
      </RequireOperatorSession>
    </SdkworkSessionAuthBrowserRoot>
  );
}

export function ManagerPcApp({
  locale,
  modules,
  onLocaleChange,
}: ManagerPcAppProps) {
  const runtimeConfig = useManagerAuthRuntimeConfig();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ManagerAuthenticatedAuthRouteGuard>
              <ManagerAuthRoutes authRuntime={runtimeConfig} locale={locale} />
            </ManagerAuthenticatedAuthRouteGuard>
          }
          path="/auth/*"
        />
        <Route
          element={(
            <ProtectedAdminArea
              locale={locale}
              modules={modules}
              onLocaleChange={onLocaleChange}
              runtimeConfig={runtimeConfig.runtimeConfig}
            />
          )}
          path="/*"
        />
      </Routes>
    </BrowserRouter>
  );
}

export { AdminHostIntegrationPage } from "./admin-host-shell";
export * from "./i18n";
