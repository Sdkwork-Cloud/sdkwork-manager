import { describe, expect, it } from "vitest";

import { createSdkworkManagerPaymentAdminContribution } from "../src";

describe("createSdkworkManagerPaymentAdminContribution", () => {
  it("registers independent operational, provider, configuration, and developer routes", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "development");

    expect(contribution.pathPrefix).toBe("/admin/payments");
    expect(contribution.displayName).toBe("Payments");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/payments/monitor",
      "/admin/payments/attempts",
      "/admin/payments/webhooks",
      "/admin/payments/reconciliation",
      "/admin/payments/providers",
      "/admin/payments/sub-merchants",
      "/admin/payments/methods",
      "/admin/payments/channels",
      "/admin/payments/route-rules",
      "/admin/payments/integration",
    ]);
    expect(contribution.routes.map((route) => route.label)).toEqual([
      "Payment records",
      "Payment attempts",
      "Webhook events",
      "Reconciliation",
      "Providers",
      "Sub-merchants",
      "Payment methods",
      "Payment channels",
      "Routing rules",
      "Integration",
    ]);
    expect(contribution.routes.map((route) => route.navigationGroups?.[0]?.id)).toEqual([
      "operations",
      "operations",
      "operations",
      "operations",
      "institutions",
      "institutions",
      "configuration",
      "configuration",
      "configuration",
      "developer-tools",
    ]);
  });

  it("maps each operational page to its own read permission", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "production");

    expect(contribution.routes.slice(0, 4).map((route) => route.requiredPermissions)).toEqual([
      ["commerce.payments.intents.read"],
      ["commerce.payments.attempts.read"],
      ["commerce.payments.webhook_events.read"],
      ["commerce.payments.reconciliation_runs.read"],
    ]);
    expect(contribution.routes.every((route) => route.permissionMode === "all")).toBe(true);
  });

  it("does not register sandbox integration tools in production", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "production");

    expect(contribution.routes.map((route) => route.path)).not.toContain(
      "/admin/payments/integration",
    );
    expect(contribution.routes).toHaveLength(9);
  });

  it("localizes the payment information architecture", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("zh-CN", "production");

    expect(contribution.displayName).toBe("支付管理");
    expect(contribution.routes[0]?.label).toBe("支付记录");
    expect(contribution.routes[1]?.label).toBe("支付尝试");
    expect(contribution.routes[2]?.label).toBe("Webhook 事件");
    expect(contribution.routes[3]?.label).toBe("对账中心");
    expect(contribution.routes[0]?.navigationGroups?.[0]?.label).toBe("支付运营");
    expect(contribution.routes[4]?.navigationGroups?.[0]?.label).toBe("机构管理");
    expect(contribution.routes[6]?.navigationGroups?.[0]?.label).toBe("支付配置");
  });
});
