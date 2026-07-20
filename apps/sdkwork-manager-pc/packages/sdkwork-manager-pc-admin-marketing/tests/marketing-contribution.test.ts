import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
    expect(contribution.commercial).toEqual({
      entitlementKey: "sdkwork.marketing.admin",
      releaseChannel: "stable",
      tier: "professional",
    });
  });

  it("exposes coupon creation as an explicit Chinese product workflow", () => {
    const contribution = createSdkworkManagerMarketingAdminContribution("zh-CN");
    const couponRoute = contribution.routes.find(
      (route) => route.path === "/admin/marketing/offers",
    );

    expect(couponRoute?.label).toBe("优惠券");
    expect(couponRoute?.description).toContain("创建优惠券");
    expect(couponRoute?.navigationGroups?.[0]?.label).toBe("活动与优惠券");
  });

  it("keeps the commercial coupon lifecycle fields and searchable selectors", () => {
    const source = readFileSync(
      resolve(process.cwd(), "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-marketing/src/index.tsx"),
      "utf8",
    );

    expect(source).toContain("创建优惠券");
    expect(source).toContain("maximumDiscountAmount");
    expect(source).toContain("claimStartsAt");
    expect(source).toContain("expiresAt");
    expect(source).toContain("<EntityPicker");
    expect(source).toContain("service.listCampaigns");
    expect(source).toContain("service.listOffers");
    expect(source).toContain("service.listCouponStocks");
    expect(source).toContain("ownerUserIds.length > 200");
  });

  it("keeps coupon batch and stock workflows on the coupon list action rail", () => {
    const source = readFileSync(
      resolve(process.cwd(), "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-marketing/src/index.tsx"),
      "utf8",
    );

    expect(source).toContain("manager-coupon-actions");
    expect(source).toContain("创建批次");
    expect(source).toContain("库存设置");
    expect(source).toContain("service.createCodeBatch(batchDraft)");
    expect(source).toContain("service.createCouponStock(stockDraft)");
    expect(source).toContain("quantity > Number(selectedBatchStock.availableQuantity)");
    expect(source).toContain("autoSelectFirst");
  });
});
