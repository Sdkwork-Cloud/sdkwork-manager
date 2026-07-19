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
      moduleNavigation: "Module navigation",
      noAvailableCapabilities: "No available capabilities.",
      selectModule: "Select a module.",
      workspace: "Workspace",
    },
  }),
}));

import { AdminModuleNavigation } from "../src/admin-host-shell";

const routeDefinitions = [
  ["iam.users", "Users", "/admin/iam/users", ["iam.users.read"], "directory", "Directory"],
  ["iam.tenants", "Tenants", "/admin/iam/tenants", ["iam.tenants.read"], "directory", "Directory"],
  ["iam.organizations", "Organizations", "/admin/iam/organizations", ["iam.organizations.read"], "directory", "Directory"],
  ["iam.authorization", "Authorization", "/admin/iam/authorization", ["iam.roles.read", "iam.permissions.read"], "access-control", "Access control"],
  ["iam.oauth", "OAuth", "/admin/iam/oauth", ["iam.oauth.read"], "federation", "Federation"],
  ["iam.account-binding", "Account binding", "/admin/iam/account-binding", ["iam.account_binding_policy.read"], "federation", "Federation"],
  ["iam.audit", "Audit", "/admin/iam/audit", ["iam.audit_events.read"], "security", "Security"],
] as const;

const routes: AdminModuleRoute[] = routeDefinitions.map(([
  id,
  label,
  path,
  permissions,
  groupId,
  groupLabel,
]) => ({
  Component: () => null,
  description: `${label} capability`,
  id,
  label,
  navigationGroups: [{ id: groupId, label: groupLabel }],
  path,
  requiredPermissions: [...permissions],
}));

const contribution: AdminModuleContribution = {
  access: {
    permissionMode: "any",
    requiredPermissions: routes.flatMap((route) => route.requiredPermissions ?? []),
  },
  capability: "identity-access",
  commercial: {
    entitlementKey: "sdkwork.iam.admin",
    releaseChannel: "stable",
    tier: "standard",
  },
  defaultPath: "/admin/iam/users",
  displayName: "Identity and access",
  domain: "iam",
  header: {
    Context: () => createElement("span", null, "stable release"),
    actions: [{ id: "module-action", label: "Open another module", onSelect: () => undefined }],
    description: "Identity administration",
    title: "Identity and access",
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
  it("renders only the current module menu without a sidebar header or module actions", () => {
    const html = renderNavigation(routeDefinitions.flatMap(([, , , permissions]) => permissions));

    for (const label of ["Users", "Tenants", "Organizations", "Authorization", "OAuth", "Account binding", "Audit"]) {
      expect(html).toContain(label);
    }
    for (const groupLabel of ["Directory", "Access control", "Federation", "Security"]) {
      expect(html).toContain(groupLabel);
    }
    expect(html.indexOf("Directory")).toBeLessThan(html.indexOf("Access control"));
    expect(html.indexOf("Access control")).toBeLessThan(html.indexOf("Federation"));
    expect(html).not.toContain("manager-sidebar__header");
    expect(html).not.toContain("stable release");
    expect(html).not.toContain("Open another module");
    expect(html).not.toContain("iam.users.read");
  });

  it("filters inaccessible routes instead of displaying technical entries", () => {
    const html = renderNavigation(["iam.users.read"]);

    expect(html).toContain("Users");
    expect(html).toContain("Directory");
    expect(html).not.toContain("Tenants");
    expect(html).not.toContain("Access control");
  });
});
