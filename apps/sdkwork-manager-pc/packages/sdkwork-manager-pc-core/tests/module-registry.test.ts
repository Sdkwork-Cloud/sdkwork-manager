import { describe, expect, it } from "vitest";

import {
  createAdminModuleAccessScope,
  createSdkworkCoreModuleRegistry,
  type AdminModuleContribution,
} from "../src/composition/module-registry";

const EmptyRoute = () => null;

function createContribution(
  overrides: Partial<AdminModuleContribution> = {},
): AdminModuleContribution {
  return {
    access: {},
    capability: "users",
    commercial: {
      entitlementKey: "sdkwork.iam.admin.users",
      releaseChannel: "stable",
      tier: "foundation",
    },
    defaultPath: "/admin/iam/users",
    displayName: "Identity",
    domain: "iam",
    header: {
      description: "Identity operator workflows.",
      title: "Identity",
    },
    id: "iam.users",
    packageName: "@sdkwork/iam-pc-admin-user",
    pathPrefix: "/admin/iam",
    routes: [
      {
        Component: EmptyRoute,
        id: "iam.users.list",
        label: "Users",
        path: "/admin/iam/users",
      },
    ],
    surface: "backend-admin",
    ...overrides,
  };
}

describe("createSdkworkCoreModuleRegistry", () => {
  it("resolves an owning module and route from a registered admin path", () => {
    const contribution = createContribution();
    const registry = createSdkworkCoreModuleRegistry([contribution]);

    expect(registry.findModuleForPath("/admin/iam/users/42")).toBe(contribution);
    expect(registry.findRouteForPath("/admin/iam/users")).toBe(contribution.routes[0]);
    expect(registry.resolveDefaultPath()).toBe("/admin/iam/users");
  });

  it("resolves parameterized detail routes without exposing them in navigation", () => {
    const detailRoute = {
      Component: EmptyRoute,
      id: "iam.users.detail",
      label: "User detail",
      navigationVisible: false,
      path: "/admin/iam/users/:userId",
      requiredPermissions: ["iam.users.read"],
    };
    const contribution = createContribution({
      routes: [createContribution().routes[0], detailRoute],
    });
    const registry = createSdkworkCoreModuleRegistry([contribution]);
    const scope = createAdminModuleAccessScope({ permissionScope: ["iam.users.read"] });

    expect(registry.findRouteForPath("/admin/iam/users/42")).toBe(detailRoute);
    expect(registry.listVisibleRoutes(contribution, scope)).toEqual([contribution.routes[0]]);
  });

  it("prefers a static route over a parameterized route", () => {
    const staticRoute = {
      Component: EmptyRoute,
      id: "iam.users.new",
      label: "New user",
      path: "/admin/iam/users/new",
    };
    const detailRoute = {
      Component: EmptyRoute,
      id: "iam.users.detail",
      label: "User detail",
      path: "/admin/iam/users/:userId",
    };
    const contribution = createContribution({
      routes: [createContribution().routes[0], detailRoute, staticRoute],
    });
    const registry = createSdkworkCoreModuleRegistry([contribution]);

    expect(registry.findRouteForPath("/admin/iam/users/new")).toBe(staticRoute);
  });

  it("rejects duplicate module identity before the shell can render", () => {
    const first = createContribution();
    const second = createContribution({
      capability: "organizations",
      defaultPath: "/admin/iam/organizations",
      id: "iam.users",
      routes: [
        {
          Component: EmptyRoute,
          id: "iam.organizations.list",
          label: "Organizations",
          path: "/admin/iam/organizations",
        },
      ],
    });

    expect(() => createSdkworkCoreModuleRegistry([first, second])).toThrow(
      "Duplicate admin module id",
    );
  });

  it("rejects a contribution that attempts to escape its namespace", () => {
    const contribution = createContribution({
      defaultPath: "/admin/platform/users",
      routes: [
        {
          Component: EmptyRoute,
          id: "iam.users.escape",
          label: "Users",
          path: "/admin/platform/users",
        },
      ],
    });

    expect(() => createSdkworkCoreModuleRegistry([contribution])).toThrow(
      "must remain inside module prefix",
    );
  });

  it("rejects overlapping module prefixes before Header ownership becomes ambiguous", () => {
    const first = createContribution();
    const second = createContribution({
      capability: "profile",
      defaultPath: "/admin/iam/users/profile",
      id: "iam.profile",
      pathPrefix: "/admin/iam/users",
      routes: [
        {
          Component: EmptyRoute,
          id: "iam.profile.overview",
          label: "Profile",
          path: "/admin/iam/users/profile",
        },
      ],
    });

    expect(() => createSdkworkCoreModuleRegistry([first, second])).toThrow(
      "Overlapping admin module path prefix",
    );
  });

  it("uses the configured default route only when the operator can open it", () => {
    const contribution = createContribution({
      defaultPath: "/admin/iam/audit",
      routes: [
        {
          Component: EmptyRoute,
          id: "iam.users.list",
          label: "Users",
          path: "/admin/iam/users",
          requiredPermissions: ["iam.users.read"],
        },
        {
          Component: EmptyRoute,
          id: "iam.audit.list",
          label: "Audit",
          path: "/admin/iam/audit",
          requiredPermissions: ["iam.audit_events.read"],
        },
      ],
    });
    const registry = createSdkworkCoreModuleRegistry([contribution]);
    const auditOnlyScope = createAdminModuleAccessScope({
      permissionScope: ["iam.audit_events.read"],
    });

    expect(registry.listVisibleRoutes(contribution, auditOnlyScope)).toEqual([
      contribution.routes[1],
    ]);
    expect(registry.resolveModuleDefaultPath(contribution, auditOnlyScope)).toBe(
      "/admin/iam/audit",
    );
    expect(registry.resolveDefaultPath(auditOnlyScope)).toBe("/admin/iam/audit");
    expect(registry.resolveDefaultPath(createAdminModuleAccessScope())).toBe("/");
  });

  it("requires every permission for an all-mode route", () => {
    const route = {
      Component: EmptyRoute,
      id: "iam.users.composite",
      label: "Composite users",
      path: "/admin/iam/users/composite",
      permissionMode: "all" as const,
      requiredPermissions: ["iam.users.read", "iam.users.update"],
    };
    const registry = createSdkworkCoreModuleRegistry([
      createContribution({ defaultPath: route.path, routes: [route] }),
    ]);

    expect(registry.hasRouteAccess(route, createAdminModuleAccessScope({
      permissionScope: ["iam.users.read"],
    }))).toBe(false);
    expect(registry.hasRouteAccess(route, createAdminModuleAccessScope({
      permissionScope: ["iam.users.read", "iam.users.update"],
    }))).toBe(true);
  });

  it("grants every registered URL to the platform super administrator without enumerating permissions", () => {
    const route = {
      Component: EmptyRoute,
      id: "iam.users.composite",
      label: "Composite users",
      path: "/admin/iam/users/composite",
      permissionMode: "all" as const,
      requiredPermissions: ["iam.users.read", "iam.users.update"],
    };
    const contribution = createContribution({
      access: { requiredPermissions: ["iam.users.read"] },
      defaultPath: route.path,
      routes: [route],
    });
    const registry = createSdkworkCoreModuleRegistry([contribution]);
    const superAdminScope = createAdminModuleAccessScope({
      standardRoleCodes: ["platform_super_admin"],
    });

    expect(registry.hasModuleAccess(contribution, superAdminScope)).toBe(true);
    expect(registry.hasRouteAccess(route, superAdminScope)).toBe(true);
    expect(registry.listVisibleModules(superAdminScope)).toEqual([contribution]);
    expect(registry.resolveDefaultPath(superAdminScope)).toBe(route.path);
  });

  it("treats commercial offers as metadata and authorizes modules by IAM permissions", () => {
    const paidContribution = createContribution({
      access: { requiredPermissions: ["iam.users.read"] },
      commercial: {
        entitlementKey: "sdkwork.iam.advanced-admin",
        releaseChannel: "stable",
        tier: "professional",
      },
    });
    const registry = createSdkworkCoreModuleRegistry([paidContribution]);
    const deniedScope = createAdminModuleAccessScope();
    const allowedScope = createAdminModuleAccessScope({ permissionScope: ["iam.users.read"] });

    expect(registry.hasModuleAccess(paidContribution, deniedScope)).toBe(false);
    expect(registry.listVisibleModules(deniedScope)).toEqual([]);
    expect(registry.resolveDefaultPath(deniedScope)).toBe("/");
    expect(registry.hasModuleAccess(paidContribution, allowedScope)).toBe(true);
    expect(registry.resolveDefaultPath(allowedScope)).toBe("/admin/iam/users");
  });
});
