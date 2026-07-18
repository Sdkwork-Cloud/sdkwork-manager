import { describe, expect, it, vi } from "vitest";

vi.mock("@sdkwork/manager-pc-admin-core", () => ({
  getManagerPromotionBackendService: () => ({}),
}));

import { createSdkworkManagerMarketingAdminContribution } from "../src";

describe("createSdkworkManagerMarketingAdminContribution", () => {
  it("registers five marketing operations routes", () => {
    const contribution = createSdkworkManagerMarketingAdminContribution("en-US");

    expect(contribution.pathPrefix).toBe("/admin/marketing");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/marketing/overview",
      "/admin/marketing/offers",
      "/admin/marketing/stocks",
      "/admin/marketing/codes",
      "/admin/marketing/applications",
    ]);
    expect(contribution.routes.every((route) => route.requiredPermissions?.includes("commerce.marketing.read"))).toBe(true);
  });
});
