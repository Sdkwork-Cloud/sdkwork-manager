import { describe, expect, it } from "vitest";

import { createSdkworkManagerIamAdminContribution } from "../src/index";

describe("manager IAM OAuth navigation", () => {
  it("contributes account configuration and application access as the only OAuth workflows", () => {
    const contribution = createSdkworkManagerIamAdminContribution({
      getPermissionScope: () => ["iam.oauth.read", "iam.oauth.manage"],
      getService: () => ({}) as never,
      getTenantId: () => "tenant-test",
      locale: "zh-CN",
    });
    const oauthRoutes = contribution.routes.filter((route) => route.id.startsWith("iam.oauth."));

    expect(oauthRoutes.map((route) => [route.label, route.path])).toEqual([
      ["集成账号", "/admin/iam/oauth"],
      ["应用接入", "/admin/iam/oauth/applications"],
    ]);
    expect(oauthRoutes.every((route) => route.navigationGroups?.[0]?.id === "oauth")).toBe(true);
    expect(oauthRoutes.every((route) => route.requiredPermissions?.includes("iam.oauth.read"))).toBe(true);

    const removedTechnicalRoutes = contribution.routes.filter((route) => [
      "/admin/iam/oauth/providers",
      "/admin/iam/oauth/login-configuration",
      "/admin/iam/oauth/governance",
      "/admin/iam/oauth/authorizations",
      "/admin/iam/oauth/resources",
      "/admin/iam/oauth/activity",
    ].includes(route.path));
    expect(removedTechnicalRoutes).toHaveLength(0);
  });
});
