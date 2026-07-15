import {
  createClient,
  type SdkworkBackendClient,
} from "@sdkwork/iam-backend-sdk";
import {
  createSdkworkIamService,
  type SdkworkIamService,
} from "@sdkwork/iam-service";
import { resolvePlatformApiGatewayBaseUrl } from "@sdkwork/manager-client-core";
import {
  getAppbaseAppSdkClient,
  getOperatorTokenManager,
  registerManagerAuthenticatedSdkCacheResetter,
} from "@sdkwork/manager-pc-core";

let iamBackendSdkClient: SdkworkBackendClient | null = null;

export function getManagerIamBackendSdkClient(): SdkworkBackendClient {
  if (!iamBackendSdkClient) {
    iamBackendSdkClient = createClient({
      baseUrl: resolvePlatformApiGatewayBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return iamBackendSdkClient;
}

export function resetManagerIamBackendSdkClient(): void {
  iamBackendSdkClient = null;
}

registerManagerAuthenticatedSdkCacheResetter(resetManagerIamBackendSdkClient);

export function getManagerIamAdminService(): SdkworkIamService {
  return createSdkworkIamService({
    appbaseAppClient: getAppbaseAppSdkClient() as Parameters<typeof createSdkworkIamService>[0]["appbaseAppClient"],
    appbaseBackendClient: getManagerIamBackendSdkClient() as Parameters<typeof createSdkworkIamService>[0]["appbaseBackendClient"],
  });
}
