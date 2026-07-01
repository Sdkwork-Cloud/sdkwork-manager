import { SdkworkIamAuthRoutes } from "@sdkwork/auth-pc-react";
import {
  getManagerIamRuntime,
  resolveManagerAuthAppearance,
  resolveManagerAuthRuntimeConfig,
} from "@sdkwork/manager-pc-core";

export function ManagerAuthRoutes() {
  return (
    <SdkworkIamAuthRoutes
      appearance={resolveManagerAuthAppearance()}
      basePath="/auth"
      getRuntime={getManagerIamRuntime}
      homePath="/"
      runtimeConfig={resolveManagerAuthRuntimeConfig()}
      viewportMode="flow"
    />
  );
}
