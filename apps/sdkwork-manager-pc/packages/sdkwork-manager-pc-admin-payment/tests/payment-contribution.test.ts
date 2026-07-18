import { describe, expect, it } from "vitest";

import { createSdkworkManagerPaymentAdminContribution } from "../src";

describe("createSdkworkManagerPaymentAdminContribution", () => {
  it("registers Payment monitoring, provider, channel, and non-production integration routes", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "development");

    expect(contribution.pathPrefix).toBe("/admin/payments");
    expect(contribution.routes.map((route) => route.path)).toContain("/admin/payments/monitor");
    expect(contribution.routes.map((route) => route.path)).toContain("/admin/payments/providers");
    expect(contribution.routes.map((route) => route.path)).toContain("/admin/payments/channels");
    expect(contribution.routes.map((route) => route.path)).toContain("/admin/payments/integration");
    expect(contribution.routes[0]?.requiredPermissions).toContain("commerce.payments.intents.read");
    expect(contribution.routes[0]?.permissionMode).toBe("all");
    expect(contribution.routes[1]?.requiredPermissions).toEqual([
      "commerce.payments.provider_accounts.read",
      "commerce.payments.sub_merchants.read",
    ]);
    expect(contribution.routes[2]?.requiredPermissions).toContain(
      "commerce.payments.provider_accounts.read",
    );
  });

  it("does not register sandbox integration tools in production", () => {
    const contribution = createSdkworkManagerPaymentAdminContribution("en-US", "production");

    expect(contribution.routes.map((route) => route.path)).not.toContain(
      "/admin/payments/integration",
    );
  });
});
