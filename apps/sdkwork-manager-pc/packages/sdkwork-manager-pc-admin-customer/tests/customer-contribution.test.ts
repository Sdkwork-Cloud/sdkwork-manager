import { describe, expect, it, vi } from "vitest";

vi.mock("@sdkwork/manager-pc-admin-core", () => ({
  getManagerIamAdminService: () => ({}),
  getManagerMembershipBackendService: () => ({}),
}));
vi.mock("@sdkwork/iam-pc-admin-user", () => ({
  createSdkworkIamUserAdminController: () => ({}),
}));

import { createSdkworkManagerCustomerAdminContribution } from "../src";

describe("customer admin contribution", () => {
  it("registers Customer 360 routes behind IAM read permission", () => {
    const contribution = createSdkworkManagerCustomerAdminContribution("en-US");
    expect(contribution.defaultPath).toBe("/admin/customers/overview");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/customers/overview",
      "/admin/customers/directory",
      "/admin/customers/:userId",
    ]);
    expect(contribution.routes[2]?.navigationVisible).toBe(false);
    expect(contribution.routes.every((route) => route.requiredPermissions?.includes("iam.users.read"))).toBe(true);
    expect(contribution.routes.slice(0, 2).map((route) => route.navigationGroups?.[0]?.id)).toEqual([
      "customer-insights",
      "customer-records",
    ]);
  });

  it("resolves Chinese module copy", () => {
    expect(createSdkworkManagerCustomerAdminContribution("zh-CN").displayName).toBe("用户中心");
  });
});
