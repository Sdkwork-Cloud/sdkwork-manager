import { describe, expect, it, vi } from "vitest";

vi.mock("@sdkwork/manager-pc-admin-core", () => ({
  getManagerPromotionBackendService: () => ({}),
}));

import { createSdkworkManagerMarketingAdminContribution } from "../src";

describe("createSdkworkManagerMarketingAdminContribution", () => {
  it("registers the complete marketing administration routes", () => {
    const contribution = createSdkworkManagerMarketingAdminContribution("en-US");

    expect(contribution.pathPrefix).toBe("/admin/marketing");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/marketing/overview",
      "/admin/marketing/campaigns",
      "/admin/marketing/offers",
      "/admin/marketing/stocks",
      "/admin/marketing/codeBatches",
      "/admin/marketing/distributions",
      "/admin/marketing/claims",
      "/admin/marketing/codes",
      "/admin/marketing/ledger",
      "/admin/marketing/applications",
    ]);
    expect(contribution.routes.every((route) => route.requiredPermissions?.includes("commerce.marketing.read"))).toBe(true);
    expect(contribution.routes.map((route) => route.navigationGroups?.[0]?.id)).toEqual([
      "insights",
      "campaign",
      "campaign",
      "delivery",
      "delivery",
      "delivery",
      "lifecycle",
      "lifecycle",
      "audit",
      "audit",
    ]);
  });
});
