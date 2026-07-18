import type { AdminModuleContribution } from "@sdkwork/manager-pc-core";
import { getManagerPermissionScope } from "@sdkwork/manager-pc-core";
import { getManagerIamAdminService } from "@sdkwork/manager-pc-admin-core";
import { createSdkworkManagerDriveAdminContribution } from "@sdkwork/manager-pc-admin-drive";
import { createSdkworkManagerIamAdminContribution } from "@sdkwork/manager-pc-admin-iam";
import { createSdkworkManagerPaymentAdminContribution } from "@sdkwork/manager-pc-admin-payment";
import { createSdkworkManagerTradeAdminContribution } from "@sdkwork/manager-pc-admin-trade";
import { createSdkworkManagerMarketingAdminContribution } from "@sdkwork/manager-pc-admin-marketing";
import { createSdkworkManagerMembershipAdminContribution } from "@sdkwork/manager-pc-admin-membership";
import { createSdkworkManagerCustomerAdminContribution } from "@sdkwork/manager-pc-admin-customer";
import {
  AdminHostIntegrationPage,
  MANAGER_SHELL_I18N_CATALOG,
} from "@sdkwork/manager-pc-shell";

export function createManagerAdminModuleAssembly(locale: string): readonly AdminModuleContribution[] {
  const integrationMessages = MANAGER_SHELL_I18N_CATALOG.resolveMessages(locale).integration;
  return [
    {
      access: {},
      capability: "integration",
      commercial: {
        entitlementKey: "sdkwork-manager.host.integration",
        releaseChannel: "stable",
        tier: "foundation",
      },
      defaultPath: "/admin/integration",
      displayName: integrationMessages.displayName,
      domain: "platform",
      header: {
        description: integrationMessages.headerDescription,
        title: integrationMessages.headerTitle,
      },
      id: "platform.integration",
      packageName: "@sdkwork/manager-pc-shell",
      pathPrefix: "/admin/integration",
      routes: [
        {
          Component: AdminHostIntegrationPage,
          description: integrationMessages.routeDescription,
          id: "platform.integration.overview",
          label: integrationMessages.overview,
          path: "/admin/integration",
        },
      ],
      surface: "backend-admin",
    },
    createSdkworkManagerIamAdminContribution({
      getPermissionScope: getManagerPermissionScope,
      getService: getManagerIamAdminService,
      locale,
    }),
    createSdkworkManagerDriveAdminContribution(locale),
    createSdkworkManagerCustomerAdminContribution(locale),
    createSdkworkManagerMembershipAdminContribution(locale),
    createSdkworkManagerTradeAdminContribution(locale),
    createSdkworkManagerMarketingAdminContribution(locale),
    createSdkworkManagerPaymentAdminContribution(locale),
  ];
}
