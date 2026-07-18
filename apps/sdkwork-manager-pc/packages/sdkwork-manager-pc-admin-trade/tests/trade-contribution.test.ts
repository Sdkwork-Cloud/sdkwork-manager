import { describe, expect, it } from "vitest";

import { createSdkworkManagerTradeAdminContribution } from "../src";

describe("createSdkworkManagerTradeAdminContribution", () => {
  it("registers the order operations route", () => {
    const contribution = createSdkworkManagerTradeAdminContribution("en-US");

    expect(contribution.pathPrefix).toBe("/admin/trade");
    expect(contribution.defaultPath).toBe("/admin/trade/orders");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/trade/orders",
      "/admin/trade/afterSales",
      "/admin/trade/shipments",
      "/admin/trade/packages",
      "/admin/trade/tokenBank",
      "/admin/trade/refunds",
      "/admin/trade/withdrawals",
    ]);
    expect(contribution.routes[0]?.requiredPermissions).toContain("commerce.orders.read");
  });

  it("provides Chinese operations copy", () => {
    const contribution = createSdkworkManagerTradeAdminContribution("zh-CN");

    expect(contribution.displayName).toBe("交易中心");
    expect(contribution.routes[0]?.label).toBe("订单管理");
  });
});
