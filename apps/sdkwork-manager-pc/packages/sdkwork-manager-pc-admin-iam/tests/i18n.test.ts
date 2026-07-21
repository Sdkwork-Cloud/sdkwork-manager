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
      "总览",
      "运行与诊断",
      "客户端应用",
      "授权与关联",
      "策略与租户",
      "登录配置",
      "身份提供商",
      "资源访问",
      "组织管理",
      "组织结构",
      "权限",
      "策略",
      "角色绑定",
      "角色",
      "租户管理",
      "用户管理",
    ]);
    expect(MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("en-US").module.routes.users.label).toBe("User management");
  });

  it("localizes the IAM navigation information architecture", () => {
    expect(MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("en-US").module.navigationGroups).toEqual({
      accessControl: "Access control",
      directory: "Identity directory",
      federation: "Connections & federation",
      oauth: "OAuth",
      security: "Security & audit",
    });
    expect(MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module.navigationGroups.directory).toBe("身份目录");
    expect(MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module.oauthOverview.title).toBe("OAuth 运行总览");
  });

  it("localizes catalog controls and state messages", () => {
    const enCatalog = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("en-US").module.catalog;
    const zhCatalog = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module.catalog;

    expect(enCatalog.editor.createTemplate).toBe("Create {kind}");
    expect(enCatalog.table.empty).toBe("No records have been created yet.");
    expect(zhCatalog.labels).toEqual({ permission: "权限", policy: "策略", role: "角色" });
    expect(zhCatalog.notices.deleteConfirmTemplate).toContain("无法撤销");
  });
});
