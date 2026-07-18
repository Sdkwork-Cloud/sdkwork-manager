import {
  SdkworkIamAuthRoutes,
} from "@sdkwork/auth-pc-react";
import {
  getManagerIamRuntime,
  resolveManagerAuthAppearance,
} from "@sdkwork/manager-pc-core";

import { ManagerAuthShell } from "./ManagerAuthShell";
import type { ManagerAuthRuntimeConfigState } from "./useManagerAuthRuntimeConfig";
import { useManagerShellMessages } from "../i18n";

export function ManagerAuthRoutes({
  authRuntime,
  locale,
}: {
  authRuntime: ManagerAuthRuntimeConfigState;
  locale: string;
}) {
  const { auth } = useManagerShellMessages();
  if (authRuntime.status !== "ready") {
    return (
      <ManagerAuthShell>
        <section aria-live="polite" className="manager-auth-route-status" role="status">
          <p>
            {authRuntime.status === "loading"
              ? auth.connecting
              : auth.unavailable}
          </p>
          {authRuntime.status === "unavailable" ? (
            <button className="manager-auth-route-status__retry" onClick={authRuntime.retry} type="button">
              {auth.retry}
            </button>
          ) : null}
        </section>
      </ManagerAuthShell>
    );
  }

  return (
    <ManagerAuthShell>
      <SdkworkIamAuthRoutes
        appearance={resolveManagerAuthAppearance()}
        basePath="/auth"
        className="manager-auth-routes !bg-transparent"
        getRuntime={getManagerIamRuntime}
        homePath="/"
        locale={locale}
        runtimeConfig={authRuntime.runtimeConfig}
        viewportMode="flow"
      />
    </ManagerAuthShell>
  );
}
