import { describe, expect, it, vi } from "vitest";

vi.mock("@sdkwork/manager-pc-admin-core", () => ({
  getManagerMembershipBackendService: () => ({}),
}));

import { createSdkworkManagerMembershipAdminContribution } from "../src";

describe("membership admin contribution", () => {
  it("registers commercial membership routes and hides detail navigation", () => {
    const contribution = createSdkworkManagerMembershipAdminContribution("en-US");
    expect(contribution.defaultPath).toBe("/admin/memberships/overview");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/memberships/overview",
      "/admin/memberships/members",
      "/admin/memberships/members/:id",
      "/admin/memberships/plans",
      "/admin/memberships/package-groups",
      "/admin/memberships/packages",
      "/admin/memberships/entitlements",
    ]);
    expect(contribution.routes[2]?.navigationVisible).toBe(false);
    expect(contribution.routes.every((route) => route.requiredPermissions?.includes("commerce.memberships.read"))).toBe(true);
  });

  it("resolves Chinese module copy", () => {
    expect(createSdkworkManagerMembershipAdminContribution("zh-CN").displayName).toBe("会员中心");
  });
});
