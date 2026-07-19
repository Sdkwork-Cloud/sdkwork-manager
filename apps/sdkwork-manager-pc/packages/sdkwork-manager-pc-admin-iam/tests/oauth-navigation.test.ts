import { describe, expect, it } from "vitest";

import { createSdkworkManagerIamAdminContribution } from "../src/index";

describe("manager IAM OAuth navigation", () => {
  it("contributes OAuth as an independent, focused administration group", () => {
    const contribution = createSdkworkManagerIamAdminContribution({
      getPermissionScope: () => ["iam.oauth.read"],
      getService: () => ({}) as never,
      locale: "zh-CN",
    });
    const oauthRoutes = contribution.routes.filter((route) => route.id.startsWith("iam.oauth."));

    expect(oauthRoutes.map((route) => [route.label, route.path])).toEqual([
      ["总览", "/admin/iam/oauth"],
      ["身份提供商", "/admin/iam/oauth/providers"],
      ["客户端应用", "/admin/iam/oauth/applications"],
      ["登录配置", "/admin/iam/oauth/login-configuration"],
      ["策略与租户", "/admin/iam/oauth/governance"],
      ["授权与关联", "/admin/iam/oauth/authorizations"],
      ["资源访问", "/admin/iam/oauth/resources"],
      ["运行与诊断", "/admin/iam/oauth/activity"],
    ]);
    expect(oauthRoutes.every((route) => route.navigationGroups?.[0]?.id === "oauth")).toBe(true);
    expect(oauthRoutes.every((route) => route.requiredPermissions?.includes("iam.oauth.read"))).toBe(true);

    const accountBinding = contribution.routes.find((route) => route.id === "iam.account-binding");
    expect(accountBinding?.navigationGroups?.[0]?.id).toBe("connections-federation");
  });
});
