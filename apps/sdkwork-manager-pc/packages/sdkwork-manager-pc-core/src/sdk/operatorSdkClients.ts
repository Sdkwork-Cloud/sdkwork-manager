import { attachSdkworkSdkSessionAuthBoundary } from "@sdkwork/auth-runtime-pc-react";
import {
  createClient as createAppClient,
  type SdkworkAppClient,
} from "@sdkwork/manager-app-sdk";
import {
  createClient as createBackendClient,
  type SdkworkBackendClient,
} from "@sdkwork/manager-backend-sdk";
import { resolveManagerApiBaseUrl } from "@sdkwork/manager-client-core";

import { loadManagerIamSession } from "../session/iamOperatorSessionBridge";
import { getOperatorTokenManager } from "../session/operatorSession";
import { getAppbaseAppSdkClient, resetAppbaseAppSdkClient } from "./appbaseAppSdkClient";

let backendSdkClient: SdkworkBackendClient | null = null;
let managerAppSdkClient: SdkworkAppClient | null = null;

function sharedClientConfig() {
  const session = loadManagerIamSession();
  return {
    tokenManager: getOperatorTokenManager(),
    authToken: session?.authToken,
    accessToken: session?.accessToken,
    tenantId: session?.context?.tenantId,
    organizationId: session?.context?.organizationId,
    platform: "pc" as const,
  };
}

export function getManagerBackendSdkClient(): SdkworkBackendClient {
  if (!backendSdkClient) {
    backendSdkClient = attachSdkworkSdkSessionAuthBoundary(
      createBackendClient({
        ...sharedClientConfig(),
        baseUrl: resolveManagerApiBaseUrl(),
      }),
    );
  }
  return backendSdkClient;
}

export function getManagerAppSdkClient(): SdkworkAppClient {
  if (!managerAppSdkClient) {
    managerAppSdkClient = attachSdkworkSdkSessionAuthBoundary(
      createAppClient({
        ...sharedClientConfig(),
        baseUrl: resolveManagerApiBaseUrl(),
      }),
    );
  }
  return managerAppSdkClient;
}

export function resetOperatorAuthenticatedSdkClients(): void {
  backendSdkClient = null;
  managerAppSdkClient = null;
  resetAppbaseAppSdkClient();
}

export function getOperatorAuthenticatedSdkClients() {
  return [getAppbaseAppSdkClient(), getManagerBackendSdkClient(), getManagerAppSdkClient()];
}
