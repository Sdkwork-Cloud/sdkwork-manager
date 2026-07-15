import type { AdminModuleContribution } from "@sdkwork/manager-pc-core";
import { getManagerPermissionScope } from "@sdkwork/manager-pc-core";
import { getManagerIamAdminService } from "@sdkwork/manager-pc-admin-core";
import { createSdkworkManagerIamAdminContribution } from "@sdkwork/manager-pc-admin-iam";
import { AdminHostIntegrationPage } from "@sdkwork/manager-pc-shell";

export function createManagerAdminModuleAssembly(): readonly AdminModuleContribution[] {
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
      displayName: "Integration",
      domain: "platform",
      header: {
        description: "Assembly, routing, entitlement metadata, and lifecycle conventions for product admin modules.",
        title: "Integration",
      },
      id: "platform.integration",
      packageName: "@sdkwork/manager-pc-shell",
      pathPrefix: "/admin/integration",
      routes: [
        {
          Component: AdminHostIntegrationPage,
          description: "Host integration contract",
          id: "platform.integration.overview",
          label: "Overview",
          path: "/admin/integration",
        },
      ],
      surface: "backend-admin",
    },
    createSdkworkManagerIamAdminContribution({
      getPermissionScope: getManagerPermissionScope,
      getService: getManagerIamAdminService,
    }),
  ];
}
