import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  createAdminModuleAccessScope,
  createSdkworkCoreHostRegistry,
  type AdminModuleContribution,
  type AdminModuleRoute,
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

const routes: AdminModuleRoute[] = [
  ["iam.users", "用户管理", "/admin/iam/users", ["iam.users.read"]],
  ["iam.tenants", "租户管理", "/admin/iam/tenants", ["iam.tenants.read"]],
  ["iam.organizations", "组织管理", "/admin/iam/organizations", ["iam.organizations.read"]],
  ["iam.authorization", "权限管理", "/admin/iam/authorization", ["iam.roles.read", "iam.permissions.read"]],
  ["iam.oauth", "OAuth 管理", "/admin/iam/oauth", ["iam.oauth.read"]],
  ["iam.account-binding", "账号绑定策略", "/admin/iam/account-binding", ["iam.account_binding_policy.read"]],
  ["iam.audit", "审计与安全", "/admin/iam/audit", ["iam.audit_events.read"]],
].map(([id, label, path, requiredPermissions]) => ({
  Component: () => null,
  description: `${label}功能`,
  id: id as string,
  label: label as string,
  navigationGroups: [{
    id: id === "iam.audit"
      ? "security-audit"
      : id === "iam.oauth" || id === "iam.account-binding"
        ? "connections-federation"
        : id === "iam.authorization"
          ? "access-control"
          : "identity-directory",
    label: id === "iam.audit"
      ? "安全与审计"
      : id === "iam.oauth" || id === "iam.account-binding"
        ? "连接与联合身份"
        : id === "iam.authorization"
          ? "访问控制"
          : "身份目录",
  }],
  path: path as string,
  requiredPermissions: requiredPermissions as string[],
}));

const contribution: AdminModuleContribution = {
  access: { permissionMode: "any", requiredPermissions: routes.flatMap((route) => route.requiredPermissions ?? []) },
  capability: "identity-access",
  commercial: { entitlementKey: "sdkwork.iam.admin", releaseChannel: "stable", tier: "standard" },
  defaultPath: "/admin/iam/users",
  displayName: "身份与访问",
  domain: "iam",
  header: {
    Context: () => createElement("span", null, "stable release"),
    actions: [{ id: "module-action", label: "模块操作", onSelect: () => undefined }],
    description: "身份与访问管理",
    title: "身份与访问",
  },
  id: "iam.identity-access",
  packageName: "@sdkwork/manager-pc-admin-iam",
  pathPrefix: "/admin/iam",
  routes,
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
  it("renders the complete IAM menu for the bootstrap administrator scope", () => {
    const html = renderNavigation([
      "iam.users.read",
      "iam.tenants.read",
      "iam.organizations.read",
      "iam.roles.read",
      "iam.permissions.read",
      "iam.oauth.read",
      "iam.account_binding_policy.read",
      "iam.audit_events.read",
    ]);

    for (const label of ["用户管理", "租户管理", "组织管理", "权限管理", "OAuth 管理", "账号绑定策略", "审计与安全"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("共 7 项管理功能");
    for (const groupLabel of ["身份目录", "访问控制", "连接与联合身份", "安全与审计"]) {
      expect(html).toContain(groupLabel);
    }
    expect(html.indexOf("身份目录")).toBeLessThan(html.indexOf("访问控制"));
    expect(html.indexOf("访问控制")).toBeLessThan(html.indexOf("连接与联合身份"));
    expect(html).toContain("stable release");
    expect(html).toContain("模块操作");
    expect(html).not.toContain("iam.users.read");
    expect(html).not.toContain("服务端授权");
  });

  it("filters inaccessible routes instead of displaying technical entries", () => {
    const html = renderNavigation(["iam.users.read"]);

    expect(html).toContain("用户管理");
    expect(html).toContain("身份目录");
    expect(html).not.toContain("租户管理");
    expect(html).not.toContain("访问控制");
    expect(html).toContain("共 1 项管理功能");
  });
});
