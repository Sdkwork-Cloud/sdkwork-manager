import {
  SdkworkIamAuthRoutes,
} from "@sdkwork/auth-pc-react";
import {
  getManagerIamRuntime,
  resolveManagerAuthAppearance,
} from "@sdkwork/manager-pc-core";

import { ManagerAuthShell } from "./ManagerAuthShell";
import type { ManagerAuthRuntimeConfigState } from "./useManagerAuthRuntimeConfig";

export function ManagerAuthRoutes({
  authRuntime,
}: {
  authRuntime: ManagerAuthRuntimeConfigState;
}) {
  if (authRuntime.status !== "ready") {
    return (
      <ManagerAuthShell>
        <section aria-live="polite" className="manager-auth-route-status" role="status">
          <p>
            {authRuntime.status === "loading"
              ? "Connecting to IAM..."
              : "IAM sign-in is currently unavailable."}
          </p>
          {authRuntime.status === "unavailable" ? (
            <button className="manager-auth-route-status__retry" onClick={authRuntime.retry} type="button">
              Retry
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
        locale="zh-CN"
        runtimeConfig={authRuntime.runtimeConfig}
        viewportMode="flow"
      />
    </ManagerAuthShell>
  );
}
