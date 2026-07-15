import {
  createClient,
  type SdkworkAppClient,
  type SdkworkAppConfig,
} from "@sdkwork/iam-app-sdk";
import { resolveIamAppApiBaseUrl } from "@sdkwork/manager-client-core";

import { getOperatorTokenManager } from "../session/operatorSession";
import type { ManagerIamSession } from "../session/iamOperatorSessionBridge";

let appbaseAppSdkClient: SdkworkAppClient | null = null;

export function createAppbaseAppSdkClientConfig(
  _session?: ManagerIamSession | null,
): SdkworkAppConfig {
  return {
    baseUrl: resolveIamAppApiBaseUrl(),
    platform: "pc",
    tokenManager: getOperatorTokenManager(),
  };
}

export function getAppbaseAppSdkClient(): SdkworkAppClient {
  if (!appbaseAppSdkClient) {
    appbaseAppSdkClient = createClient(createAppbaseAppSdkClientConfig());
  }
  return appbaseAppSdkClient;
}

export function resetAppbaseAppSdkClient(): void {
  appbaseAppSdkClient = null;
}
