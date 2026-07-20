import { useMemo, type ComponentType } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { SdkworkSessionAuthBrowserRoot } from "@sdkwork/auth-pc-react";
import {
  clearManagerIamSession,
  createAdminModuleAccessScope,
  getManagerIamRuntime,
  getManagerStandardRoleCodes,
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
import { useManagerPermissionScope } from "./auth/useManagerPermissionScope";
import { useManagerAuthRuntimeConfig } from "./auth/useManagerAuthRuntimeConfig";
export { logManagerSessionPageBoot } from "./auth/managerSessionDiagnostics";

type ManagerPcAppProps = {
  locale: string;
  modules: readonly AdminModuleContribution[];
  onLocaleChange: (locale: string) => void;
  renderUserCenter?: ComponentType;
};

function ProtectedAdminHost({
  locale,
  modules,
  onLocaleChange,
  renderUserCenter,
}: ManagerPcAppProps) {
  const navigate = useNavigate();
  const registry = useMemo(() => createSdkworkCoreHostRegistry(modules), [modules]);
  const permissionScope = useManagerPermissionScope();

  const accessScope = useMemo(
    () => createAdminModuleAccessScope({
      permissionScope,
      standardRoleCodes: getManagerStandardRoleCodes(),
    }),
    [permissionScope],
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
      UserCenterComponent={renderUserCenter}
    />
  );
}

function ProtectedAdminArea({
  modules,
  locale,
  onLocaleChange,
  runtimeConfig,
  renderUserCenter,
}: {
  locale: string;
  modules: readonly AdminModuleContribution[];
  onLocaleChange: (locale: string) => void;
  runtimeConfig: Parameters<typeof SdkworkSessionAuthBrowserRoot>[0]["runtimeConfig"];
  renderUserCenter?: ComponentType;
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
          renderUserCenter={renderUserCenter}
        />
      </RequireOperatorSession>
    </SdkworkSessionAuthBrowserRoot>
  );
}

export function ManagerPcApp({
  locale,
  modules,
  onLocaleChange,
  renderUserCenter,
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
              renderUserCenter={renderUserCenter}
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
