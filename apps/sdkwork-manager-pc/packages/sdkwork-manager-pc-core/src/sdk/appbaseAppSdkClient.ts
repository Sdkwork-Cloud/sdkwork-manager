import {
  createClient,
  type SdkworkAppClient,
  type SdkworkAppConfig,
} from "@sdkwork/iam-app-sdk";
import { resolveIamAppApiBaseUrl } from "@sdkwork/manager-client-core";

import { getOperatorTokenManager } from "../session/operatorSession";
import {
  loadManagerIamSession,
  type ManagerIamSession,
} from "../session/iamOperatorSessionBridge";

let appbaseAppSdkClient: SdkworkAppClient | null = null;

export function createAppbaseAppSdkClientConfig(
  session?: ManagerIamSession | null,
): SdkworkAppConfig {
  const currentSession = session ?? loadManagerIamSession();
  return {
    baseUrl: resolveIamAppApiBaseUrl(),
    accessToken: currentSession?.accessToken,
    authToken: currentSession?.authToken,
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
