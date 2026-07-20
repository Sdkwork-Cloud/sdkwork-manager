import { describe, expect, it } from "vitest";

import { createSdkworkManagerPaymentAdminContribution } from "../src";

describe("createSdkworkManagerPaymentAdminContribution", () => {
  it("registers independent operational, provider, configuration, and developer routes", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "development");

    expect(contribution.pathPrefix).toBe("/admin/payments");
    expect(contribution.displayName).toBe("Payments");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/payments/providers",
      "/admin/payments/monitor",
      "/admin/payments/refunds",
      "/admin/payments/attempts",
      "/admin/payments/webhooks",
      "/admin/payments/reconciliation",
      "/admin/payments/sub-merchants",
      "/admin/payments/methods",
      "/admin/payments/channels",
      "/admin/payments/route-rules",
      "/admin/payments/integration/environments",
      "/admin/payments/integration/webhook-debugger",
      "/admin/payments/integration/certificates",
      "/admin/payments/integration/logs",
    ]);
    expect(contribution.routes.map((route) => route.label)).toEqual([
      "Payment accounts",
      "Payment records",
      "Refund processing",
      "Payment attempts",
      "Webhook events",
      "Reconciliation",
      "Sub-merchants",
      "Payment methods",
      "Payment channels",
      "Routing rules",
      "Environment & credential tests",
      "Webhook debugger",
      "Certificates",
      "Integration logs",
    ]);
    expect(contribution.routes.map((route) => route.navigationGroups?.[0]?.id)).toEqual([
      "institutions",
      "operations",
      "operations",
      "operations",
      "operations",
      "operations",
      "institutions",
      "configuration",
      "configuration",
      "configuration",
      "developer-tools",
      "developer-tools",
      "developer-tools",
      "developer-tools",
    ]);
  });

  it("maps each operational page to its own read permission", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "production");

    expect(contribution.routes.slice(1, 6).map((route) => route.requiredPermissions)).toEqual([
      ["commerce.payments.intents.read"],
      ["commerce.payments.refunds.read"],
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
    expect(contribution.routes).toHaveLength(10);
  });

  it("localizes the payment information architecture", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("zh-CN", "production");

    expect(contribution.displayName).toBe("支付管理");
    expect(contribution.routes[0]?.label).toBe("支付账号");
    expect(contribution.routes[1]?.label).toBe("支付记录");
    expect(contribution.routes[2]?.label).toBe("退款处理");
    expect(contribution.routes[3]?.label).toBe("支付尝试");
    expect(contribution.routes[4]?.label).toBe("Webhook 事件");
    expect(contribution.routes[5]?.label).toBe("对账中心");
    expect(contribution.routes[0]?.navigationGroups?.[0]?.label).toBe("支付账号配置");
    expect(contribution.routes[1]?.navigationGroups?.[0]?.label).toBe("支付运营");
    expect(contribution.routes[7]?.navigationGroups?.[0]?.label).toBe("高级支付编排");
  });
});
