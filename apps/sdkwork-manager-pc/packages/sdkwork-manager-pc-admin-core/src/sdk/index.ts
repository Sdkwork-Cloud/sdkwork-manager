import {
  createClient,
  type SdkworkBackendClient,
} from "@sdkwork/iam-backend-sdk";
import {
  createSdkworkIamService,
  type SdkworkIamService,
} from "@sdkwork/iam-service";
import {
  resolveManagerDeploymentProfile,
  resolveManagerEnvironment,
  resolveIamBackendApiBaseUrl,
  resolveManagerBackendApiBaseUrl,
  resolvePlatformApiGatewayBaseUrl,
} from "@sdkwork/manager-client-core";
import {
  createClient as createManagerBackendClient,
  type SdkworkBackendClient as ManagerBackendClient,
} from "@sdkwork/manager-backend-sdk";
import {
  createDriveAdminStorageSdkClient,
  createDriveBackendSdkClient,
  type DriveAdminStorageSdkClient,
  type DriveBackendSdkClient,
} from "sdkwork-drive-pc-admin-core";
import {
  createRuntimeConfig as createDriveRuntimeConfig,
  type SessionSnapshot as DriveSessionSnapshot,
} from "sdkwork-drive-pc-core";
import {
  createClient as createPaymentBackendClient,
  type SdkworkBackendClient as PaymentBackendClient,
} from "@sdkwork/payment-backend-sdk";
import {
  createClient as createOrderBackendClient,
  type SdkworkBackendClient as OrderBackendClient,
} from "@sdkwork/order-backend-sdk";
import {
  createOrderAdminService,
  type OrderAdminService,
  createTradeOperationsService,
  type TradeOperationsService,
} from "@sdkwork/order-pc-admin-orders/service";
import {
  createSdkworkPaymentBackendService,
  type SdkworkPaymentBackendService,
} from "@sdkwork/payment-service";
import {
  createClient as createPromotionBackendClient,
  type SdkworkBackendClient as PromotionBackendClient,
} from "@sdkwork/promotion-backend-sdk";
import {
  createSdkworkPromotionBackendService,
  type SdkworkPromotionBackendService,
} from "@sdkwork/promotion-service";
import {
  createClient as createMembershipBackendClient,
  type SdkworkBackendClient as MembershipBackendClient,
} from "@sdkwork/membership-backend-sdk";
import {
  createSdkworkMembershipBackendService,
  type SdkworkMembershipBackendService,
} from "@sdkwork/membership-service";
import {
  getAppbaseAppSdkClient,
  getOperatorTokenManager,
  getManagerPermissionScope,
  loadManagerIamSession,
  registerManagerAuthenticatedSdkCacheResetter,
} from "@sdkwork/manager-pc-core";

let iamBackendSdkClient: SdkworkBackendClient | null = null;
let driveBackendSdkClient: DriveBackendSdkClient | null = null;
let driveAdminStorageSdkClient: DriveAdminStorageSdkClient | null = null;
let paymentBackendSdkClient: PaymentBackendClient | null = null;
let paymentBackendService: SdkworkPaymentBackendService | null = null;
let orderBackendSdkClient: OrderBackendClient | null = null;
let orderAdminService: OrderAdminService | null = null;
let tradeOperationsService: TradeOperationsService | null = null;
let promotionBackendSdkClient: PromotionBackendClient | null = null;
let promotionBackendService: SdkworkPromotionBackendService | null = null;
let membershipBackendSdkClient: MembershipBackendClient | null = null;
let membershipBackendService: SdkworkMembershipBackendService | null = null;
let managerBackendSdkClient: ManagerBackendClient | null = null;

export function listManagerAdminSdkInventory() {
  return [
    "@sdkwork/manager-backend-sdk",
    "@sdkwork/iam-backend-sdk",
    "@sdkwork/drive-backend-sdk",
    "@sdkwork/drive-admin-storage-sdk",
    "@sdkwork/payment-backend-sdk",
    "@sdkwork/order-backend-sdk",
    "@sdkwork/promotion-backend-sdk",
    "@sdkwork/membership-backend-sdk",
  ] as const;
}

export function getManagerBackendSdkClient(): ManagerBackendClient {
  if (!managerBackendSdkClient) {
    managerBackendSdkClient = createManagerBackendClient({
      baseUrl: resolveManagerBackendApiBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return managerBackendSdkClient;
}

export function getManagerIamBackendSdkClient(): SdkworkBackendClient {
  if (!iamBackendSdkClient) {
    iamBackendSdkClient = createClient({
      baseUrl: resolveIamBackendApiBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return iamBackendSdkClient;
}

export function resetManagerIamBackendSdkClient(): void {
  iamBackendSdkClient = null;
}

function createManagerDriveRuntimeConfig() {
  const platformGatewayBaseUrl = resolvePlatformApiGatewayBaseUrl();
  const environment = resolveManagerEnvironment();
  const deploymentProfile = resolveManagerDeploymentProfile();
  return createDriveRuntimeConfig({
    VITE_DRIVE_PC_BACKEND_API_BASE_URL: platformGatewayBaseUrl,
    VITE_DRIVE_PC_DEPLOYMENT_PROFILE: deploymentProfile,
    VITE_DRIVE_PC_DRIVE_ADMIN_STORAGE_API_BASE_URL: platformGatewayBaseUrl,
    VITE_DRIVE_PC_ENVIRONMENT: environment,
    VITE_DRIVE_PC_PLATFORM_API_GATEWAY_HTTP_URL: platformGatewayBaseUrl,
    VITE_DRIVE_PC_RUNTIME_TARGET: "browser",
    VITE_DRIVE_PC_TOKEN_MANAGER_MODE: "appbase-global",
    VITE_DRIVE_PC_TOKEN_STORAGE: "browser-local",
  });
}

export function getManagerDriveBackendSdkClient(): DriveBackendSdkClient {
  if (!driveBackendSdkClient) {
    driveBackendSdkClient = createDriveBackendSdkClient({
      config: createManagerDriveRuntimeConfig(),
      tokenManager: getOperatorTokenManager(),
    });
  }
  return driveBackendSdkClient;
}

export function getManagerDriveAdminStorageSdkClient(): DriveAdminStorageSdkClient {
  if (!driveAdminStorageSdkClient) {
    driveAdminStorageSdkClient = createDriveAdminStorageSdkClient({
      config: createManagerDriveRuntimeConfig(),
      tokenManager: getOperatorTokenManager(),
    });
  }
  return driveAdminStorageSdkClient;
}

export function getManagerDriveSessionSnapshot(): DriveSessionSnapshot {
  const session = loadManagerIamSession();
  const context = session?.context;
  const sessionId = session?.sessionId ?? context?.sessionId;
  return {
    accessToken: session?.accessToken,
    authToken: session?.authToken,
    refreshToken: session?.refreshToken,
    sessionId,
    user: context?.userId
      ? { id: context.userId }
      : undefined,
    context: context?.tenantId && context.userId
      ? {
          actorId: context.userId,
          actorKind: "user",
          appId: context.appId,
          authLevel: context.authLevel,
          dataScope: [...context.dataScope],
          deploymentMode: context.deploymentMode,
          environment: context.environment,
          organizationId: context.organizationId,
          permissionScope: [...getManagerPermissionScope()],
          sessionId,
          tenantId: context.tenantId,
          userId: context.userId,
        }
      : undefined,
  };
}

export function getManagerPaymentBackendSdkClient(): PaymentBackendClient {
  if (!paymentBackendSdkClient) {
    paymentBackendSdkClient = createPaymentBackendClient({
      baseUrl: resolvePlatformApiGatewayBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return paymentBackendSdkClient;
}

export function getManagerPaymentBackendService(): SdkworkPaymentBackendService {
  if (!paymentBackendService) {
    paymentBackendService = createSdkworkPaymentBackendService(
      getManagerPaymentBackendSdkClient(),
    );
  }
  return paymentBackendService;
}

export function getManagerOrderBackendSdkClient(): OrderBackendClient {
  if (!orderBackendSdkClient) {
    orderBackendSdkClient = createOrderBackendClient({
      baseUrl: resolvePlatformApiGatewayBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return orderBackendSdkClient;
}

export function getManagerOrderAdminService(): OrderAdminService {
  if (!orderAdminService) {
    orderAdminService = createOrderAdminService(getManagerOrderBackendSdkClient());
  }
  return orderAdminService;
}

export function getManagerTradeOperationsService(): TradeOperationsService {
  if (!tradeOperationsService) {
    tradeOperationsService = createTradeOperationsService(getManagerOrderBackendSdkClient());
  }
  return tradeOperationsService;
}

export function getManagerPromotionBackendSdkClient(): PromotionBackendClient {
  if (!promotionBackendSdkClient) {
    promotionBackendSdkClient = createPromotionBackendClient({
      baseUrl: resolvePlatformApiGatewayBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return promotionBackendSdkClient;
}

export function getManagerPromotionBackendService(): SdkworkPromotionBackendService {
  if (!promotionBackendService) {
    promotionBackendService = createSdkworkPromotionBackendService(
      getManagerPromotionBackendSdkClient(),
    );
  }
  return promotionBackendService;
}

export function getManagerMembershipBackendSdkClient(): MembershipBackendClient {
  if (!membershipBackendSdkClient) {
    membershipBackendSdkClient = createMembershipBackendClient({
      baseUrl: resolvePlatformApiGatewayBaseUrl(),
      platform: "pc",
      tokenManager: getOperatorTokenManager(),
    });
  }
  return membershipBackendSdkClient;
}

export function getManagerMembershipBackendService(): SdkworkMembershipBackendService {
  if (!membershipBackendService) {
    membershipBackendService = createSdkworkMembershipBackendService(
      getManagerMembershipBackendSdkClient(),
    );
  }
  return membershipBackendService;
}

export function resetManagerDependencyAdminSdkClients(): void {
  managerBackendSdkClient = null;
  driveBackendSdkClient = null;
  driveAdminStorageSdkClient = null;
  paymentBackendSdkClient = null;
  paymentBackendService = null;
  orderBackendSdkClient = null;
  orderAdminService = null;
  tradeOperationsService = null;
  promotionBackendSdkClient = null;
  promotionBackendService = null;
  membershipBackendSdkClient = null;
  membershipBackendService = null;
}

registerManagerAuthenticatedSdkCacheResetter(() => {
  resetManagerIamBackendSdkClient();
  resetManagerDependencyAdminSdkClients();
});

export function getManagerIamAdminService(): SdkworkIamService {
  return createSdkworkIamService({
    appbaseAppClient: getAppbaseAppSdkClient() as Parameters<typeof createSdkworkIamService>[0]["appbaseAppClient"],
    appbaseBackendClient: getManagerIamBackendSdkClient() as Parameters<typeof createSdkworkIamService>[0]["appbaseBackendClient"],
  });
}
