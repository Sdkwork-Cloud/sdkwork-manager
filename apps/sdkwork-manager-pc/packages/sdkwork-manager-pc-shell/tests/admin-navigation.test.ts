import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  createAdminModuleAccessScope,
  createSdkworkCoreHostRegistry,
  type AdminModuleContribution,
} from "@sdkwork/manager-pc-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/i18n", () => ({
  useManagerShellMessages: () => ({
    adminHost: {
      capabilityNavigation: "功能导航",
      moduleNavigation: "功能导航",
      navigationCountTemplate: "共 {count} 项管理功能",
      noAvailableCapabilities: "当前管理员账号暂无可用的管理功能。",
      selectModule: "请选择一个业务模块进入管理工作区。",
      workspace: "工作区",
    },
  }),
}));

import { AdminModuleNavigation } from "../src/admin-host-shell";

const contribution: AdminModuleContribution = {
  access: { permissionMode: "any", requiredPermissions: ["iam.users.read", "iam.tenants.read"] },
  capability: "identity-access",
  commercial: { entitlementKey: "sdkwork.iam.admin", releaseChannel: "stable", tier: "standard" },
  defaultPath: "/admin/iam/users",
  displayName: "身份与访问",
  domain: "iam",
  header: { description: "身份与访问管理", title: "身份与访问" },
  id: "iam.identity-access",
  packageName: "@sdkwork/manager-pc-admin-iam",
  pathPrefix: "/admin/iam",
  routes: [
    {
      Component: () => null,
      description: "管理用户目录与账号生命周期",
      id: "iam.users",
      label: "用户管理",
      path: "/admin/iam/users",
      requiredPermissions: ["iam.users.read"],
    },
    {
      Component: () => null,
      description: "管理租户边界、状态与成员",
      id: "iam.tenants",
      label: "租户管理",
      path: "/admin/iam/tenants",
      requiredPermissions: ["iam.tenants.read"],
    },
  ],
  surface: "backend-admin",
};

function renderNavigation(permissionScope: readonly string[]) {
  const registry = createSdkworkCoreHostRegistry([contribution]);
  const accessScope = createAdminModuleAccessScope({ permissionScope });
  return renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: ["/admin/iam/users"] },
    createElement(AdminModuleNavigation, { accessScope, registry }),
  ));
}

describe("manager admin capability navigation", () => {
  it("renders accessible business routes without exposing permission codes", () => {
    const html = renderNavigation(["iam.users.read", "iam.tenants.read"]);

    expect(html).toContain("用户管理");
    expect(html).toContain("租户管理");
    expect(html).toContain("共 2 项管理功能");
    expect(html).not.toContain("iam.users.read");
    expect(html).not.toContain("iam.tenants.read");
    expect(html).not.toContain("服务端授权");
  });

  it("filters inaccessible routes instead of displaying technical entries", () => {
    const html = renderNavigation(["iam.users.read"]);

    expect(html).toContain("用户管理");
    expect(html).not.toContain("租户管理");
    expect(html).toContain("共 1 项管理功能");
  });
});
