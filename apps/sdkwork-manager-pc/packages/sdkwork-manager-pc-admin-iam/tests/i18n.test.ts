import { assertSdkworkCatalogLocaleParity } from "@sdkwork/i18n-pc-react";
import { describe, expect, it } from "vitest";

import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "../src/i18n/manifest";

describe("manager IAM adapter i18n catalog", () => {
  it("keeps active locale fragments in parity", () => {
    expect(() => assertSdkworkCatalogLocaleParity(MANAGER_IAM_ADMIN_I18N_CATALOG)).not.toThrow();
  });

  it("uses product-facing management labels for every IAM capability", () => {
    const zhRoutes = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module.routes;
    expect(Object.values(zhRoutes).map((route) => route.label)).toEqual([
      "账号绑定策略",
      "审计与安全",
      "权限管理",
      "OAuth 管理",
      "组织管理",
      "租户管理",
      "用户管理",
    ]);
    expect(MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("en-US").module.routes.users.label).toBe("User management");
  });
});
