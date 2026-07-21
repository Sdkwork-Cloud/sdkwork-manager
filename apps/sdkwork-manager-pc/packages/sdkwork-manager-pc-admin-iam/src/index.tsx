import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  AdminModuleContribution,
  AdminModuleRoute,
} from "@sdkwork/manager-pc-core";
import { hasAdminScopePermission } from "@sdkwork/manager-pc-core";
import type { SdkworkIamService } from "@sdkwork/iam-service";

import {
  MANAGER_IAM_ADMIN_I18N_CATALOG,
  useManagerIamAdminMessages,
} from "./i18n";

type IamRouteDependencies = {
  getPermissionScope: () => readonly string[];
  getService: () => SdkworkIamService;
  getTenantId: () => string;
  locale?: string | null;
};

type IamContributionDependencies = IamRouteDependencies & {
  locale?: string | null;
};

type IamCatalogKind = "role" | "permission" | "policy";

function hasIamPermission(permissionScope: readonly string[], permission: string): boolean {
  return hasAdminScopePermission({ permissionScope, standardRoleCodes: [] }, permission);
}

function IamRouteLoadingState() {
  const { module } = useManagerIamAdminMessages();
  return <div className="manager-module-loading" role="status">{module.loading}</div>;
}

const LazyIamUserRoute = lazy(async () => {
  const { createSdkworkIamUserAdminController, SdkworkIamUserAdminWorkspace } = await import("@sdkwork/iam-pc-admin-user");
  return {
    default: function IamUserRoute({ getPermissionScope, getService, locale }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamUserAdminController(getService()), [getService]);
      const permissionScope = getPermissionScope();
      const can = (permission: string) => hasIamPermission(permissionScope, permission);
      return (
        <SdkworkIamUserAdminWorkspace
          controller={controller}
          locale={locale}
          permissions={{
            create: can("iam.users.create"),
            delete: can("iam.users.delete"),
            update: can("iam.users.update"),
          }}
        />
      );
    },
  };
});

const LazyIamTenantRoute = lazy(async () => {
  const { createSdkworkIamTenantController, SdkworkIamTenantAdminWorkspace } = await import("@sdkwork/iam-pc-admin-tenant");
  return {
    default: function IamTenantRoute({ getPermissionScope, getService }: IamRouteDependencies) {
      const permissionScope = getPermissionScope();
      const can = (permission: string) => hasIamPermission(permissionScope, permission);
      const controller = useMemo(
        () => createSdkworkIamTenantController({
          permissionScope: getPermissionScope(),
          service: getService(),
        }),
        [getPermissionScope, getService],
      );
      return (
        <SdkworkIamTenantAdminWorkspace
          controller={controller}
          permissions={{
            members: {
              create: can("iam.tenant_members.create"),
              delete: can("iam.tenant_members.delete"),
              read: can("iam.tenant_members.read"),
              update: can("iam.tenant_members.update"),
            },
            tenants: {
              create: can("iam.tenants.create"),
              delete: can("iam.tenants.delete"),
              update: can("iam.tenants.update"),
            },
          }}
        />
      );
    },
  };
});

const LazyIamOrganizationRoute = lazy(async () => {
  const { createSdkworkIamOrganizationController, SdkworkIamOrganizationAdminWorkspace } = await import("@sdkwork/iam-pc-admin-organization");
  return {
    default: function IamOrganizationRoute({ getPermissionScope, getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamOrganizationController(getService()), [getService]);
      const permissionScope = getPermissionScope();
      const can = (permission: string) => hasIamPermission(permissionScope, permission);
      const navigate = useNavigate();
      return (
        <SdkworkIamOrganizationAdminWorkspace
          controller={controller}
          onOpenStructure={(organization) => navigate(`/admin/iam/organizations/${encodeURIComponent(organization.organizationId)}/structure`)}
          permissions={{
            departments: {
              create: can("iam.departments.create"),
              delete: can("iam.departments.delete"),
              read: can("iam.departments.read"),
              update: can("iam.departments.update"),
            },
            memberships: {
              create: can("iam.memberships.create"),
              read: can("iam.memberships.read"),
              update: can("iam.memberships.update"),
            },
            organizations: {
              create: can("iam.organizations.create"),
              delete: can("iam.organizations.delete"),
              update: can("iam.organizations.update"),
            },
            positions: { read: can("iam.positions.read") },
            roleBindings: { read: can("iam.role_bindings.read") },
          }}
        />
      );
    },
  };
});

const LazyIamOrganizationStructureRoute = lazy(async () => {
  const { createSdkworkIamOrganizationController, SdkworkIamOrganizationStructureWorkspace } = await import("@sdkwork/iam-pc-admin-organization");
  return {
    default: function IamOrganizationStructureRoute({ getPermissionScope, getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamOrganizationController(getService()), [getService]);
      const navigate = useNavigate();
      const { organizationId } = useParams<{ organizationId: string }>();
      const permissionScope = getPermissionScope();
      const can = (permission: string) => hasIamPermission(permissionScope, permission);
      if (!organizationId) return null;
      return (
        <SdkworkIamOrganizationStructureWorkspace
          controller={controller}
          onBack={() => navigate("/admin/iam/organizations")}
          organizationId={organizationId}
          permissions={{
            assignments: {
              create: can("iam.assignments.create"),
              read: can("iam.assignments.read"),
              update: can("iam.assignments.update"),
            },
            departments: {
              create: can("iam.departments.create"),
              delete: can("iam.departments.delete"),
              update: can("iam.departments.update"),
            },
            memberships: { read: can("iam.memberships.read") },
          }}
        />
      );
    },
  };
});

const LazyIamCatalogRoute = lazy(async () => {
  const [
    { createSdkworkIamPermissionController },
    { IamCatalogWorkspace },
  ] = await Promise.all([
    import("@sdkwork/iam-pc-admin-permission"),
    import("./authorization/IamCatalogWorkspace"),
  ]);
  return {
    default: function IamCatalogRoute({
      getPermissionScope,
      getService,
      kind,
    }: IamRouteDependencies & { kind: IamCatalogKind }) {
      const { module } = useManagerIamAdminMessages();
      const controller = useMemo(
        () => createSdkworkIamPermissionController({
          permissionScope: getPermissionScope(),
          service: getService(),
        }),
        [getPermissionScope, getService],
      );
      const routeMessages = kind === "role"
        ? module.routes.roles
        : kind === "permission"
          ? module.routes.permissions
          : module.routes.policies;
      const permissionPrefix = kind === "role"
        ? "iam.roles"
        : kind === "permission"
          ? "iam.permissions"
          : "iam.policies";
      const permissionScope = getPermissionScope();
      const can = (permission: string) => hasIamPermission(permissionScope, permission);
      return (
        <IamCatalogWorkspace
          controller={controller}
          description={routeMessages.description}
          kind={kind}
          messages={module.catalog}
          permissions={{
            create: can(`${permissionPrefix}.create`),
            delete: can(`${permissionPrefix}.delete`),
            update: can(`${permissionPrefix}.update`),
          }}
          title={routeMessages.label}
        />
      );
    },
  };
});

const LazyIamOauthAccountRoute = lazy(async () => {
  const [
    { IamOauthAccountWorkspace },
    { createIamOauthAccountController },
  ] = await Promise.all([
    import("./oauth/IamOauthAccountWorkspace"),
    import("./services/oauthAccountController"),
  ]);
  return {
    default: function IamOauthRoute({
      getPermissionScope,
      getService,
      getTenantId,
      view,
    }: IamRouteDependencies & { view: "accounts" | "applications" }) {
      const { module } = useManagerIamAdminMessages();
      const controller = useMemo(
        () => createIamOauthAccountController({ service: getService(), tenantId: getTenantId() }),
        [getService, getTenantId],
      );
      return (
        <IamOauthAccountWorkspace
          canManage={hasIamPermission(getPermissionScope(), "iam.oauth.manage")}
          controller={controller}
          messages={module.oauthAccounts}
          view={view}
        />
      );
    },
  };
});

const LazyIamAccountBindingRoute = lazy(async () => {
  const { createSdkworkIamAccountBindingController, SdkworkIamAccountBindingSettings } = await import("@sdkwork/iam-pc-admin-account-binding");
  return {
    default: function IamAccountBindingRoute({ getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamAccountBindingController(getService()), [getService]);
      return <SdkworkIamAccountBindingSettings controller={controller} />;
    },
  };
});

const LazyIamAuditRoute = lazy(async () => {
  const { createSdkworkIamAuditController, SdkworkIamAuditAdminWorkspace } = await import("@sdkwork/iam-pc-admin-audit");
  return {
    default: function IamAuditRoute({ getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamAuditController(getService()), [getService]);
      return <SdkworkIamAuditAdminWorkspace controller={controller} />;
    },
  };
});

function createLazyRoute<TDependencies extends IamRouteDependencies>(
  Component: ComponentType<TDependencies>,
  dependencies: TDependencies,
) {
  return function IamRouteEntry() {
    return (
      <Suspense fallback={<IamRouteLoadingState />}>
        <Component {...dependencies} />
      </Suspense>
    );
  };
}

export function createSdkworkManagerIamAdminContribution(
  dependencies: IamContributionDependencies,
): AdminModuleContribution {
  const messages = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages(dependencies.locale).module;
  const oauthNavigationGroups = [{ id: "oauth", label: messages.navigationGroups.oauth }] as const;
  const oauthRoutes: AdminModuleRoute[] = [
    {
      Component: createLazyRoute(LazyIamOauthAccountRoute, { ...dependencies, view: "accounts" }),
      description: messages.oauthAccounts.form.createDescription,
      id: "iam.oauth.accounts",
      label: messages.oauthAccounts.summary.accounts,
      navigationGroups: oauthNavigationGroups,
      path: "/admin/iam/oauth",
      requiredPermissions: ["iam.oauth.read"],
    },
    {
      Component: createLazyRoute(LazyIamOauthAccountRoute, { ...dependencies, view: "applications" }),
      description: messages.oauthAccounts.applicationAccess.description,
      id: "iam.oauth.application-access",
      label: messages.oauthAccounts.applicationAccess.title,
      navigationGroups: oauthNavigationGroups,
      path: "/admin/iam/oauth/applications",
      requiredPermissions: ["iam.oauth.read"],
    },
  ];
  return {
    access: {
      permissionMode: "any",
      requiredPermissions: [
        "iam.users.read",
        "iam.tenants.read",
        "iam.organizations.read",
        "iam.roles.read",
        "iam.permissions.read",
        "iam.policies.read",
        "iam.oauth.read",
        "iam.account_binding_policy.read",
        "iam.audit_events.read",
      ],
    },
    capability: "identity-access",
    commercial: {
      entitlementKey: "sdkwork.iam.admin",
      releaseChannel: "stable",
      tier: "standard",
    },
    defaultPath: "/admin/iam/users",
    displayName: messages.displayName,
    domain: "iam",
    header: {
      description: messages.description,
      title: messages.title,
    },
    id: "iam.identity-access",
    packageName: "@sdkwork/manager-pc-admin-iam",
    pathPrefix: "/admin/iam",
    routes: [
      {
        Component: createLazyRoute(LazyIamUserRoute, dependencies),
        description: messages.routes.users.description,
        id: "iam.users",
        label: messages.routes.users.label,
        navigationGroups: [{ id: "identity-directory", label: messages.navigationGroups.directory }],
        path: "/admin/iam/users",
        requiredPermissions: ["iam.users.read"],
      },
      {
        Component: createLazyRoute(LazyIamTenantRoute, dependencies),
        description: messages.routes.tenants.description,
        id: "iam.tenants",
        label: messages.routes.tenants.label,
        navigationGroups: [{ id: "identity-directory", label: messages.navigationGroups.directory }],
        path: "/admin/iam/tenants",
        requiredPermissions: ["iam.tenants.read"],
      },
      {
        Component: createLazyRoute(LazyIamOrganizationRoute, dependencies),
        description: messages.routes.organizations.description,
        id: "iam.organizations",
        label: messages.routes.organizations.label,
        navigationGroups: [{ id: "identity-directory", label: messages.navigationGroups.directory }],
        path: "/admin/iam/organizations",
        requiredPermissions: ["iam.organizations.read"],
      },
      {
        Component: createLazyRoute(LazyIamOrganizationStructureRoute, dependencies),
        description: messages.routes.organizationStructure.description,
        id: "iam.organizations.structure",
        label: messages.routes.organizationStructure.label,
        navigationVisible: false,
        path: "/admin/iam/organizations/:organizationId/structure",
        permissionMode: "all",
        requiredPermissions: ["iam.organizations.read", "iam.departments.read", "iam.assignments.read"],
      },
      { Component: createLazyRoute(LazyIamCatalogRoute, { ...dependencies, kind: "role" }), description: messages.routes.roles.description, id: "iam.roles", label: messages.routes.roles.label, navigationGroups: [{ id: "access-control", label: messages.navigationGroups.accessControl }], path: "/admin/iam/roles", requiredPermissions: ["iam.roles.read"] },
      { Component: createLazyRoute(LazyIamCatalogRoute, { ...dependencies, kind: "permission" }), description: messages.routes.permissions.description, id: "iam.permissions", label: messages.routes.permissions.label, navigationGroups: [{ id: "access-control", label: messages.navigationGroups.accessControl }], path: "/admin/iam/permissions", requiredPermissions: ["iam.permissions.read"] },
      { Component: createLazyRoute(LazyIamCatalogRoute, { ...dependencies, kind: "policy" }), description: messages.routes.policies.description, id: "iam.policies", label: messages.routes.policies.label, navigationGroups: [{ id: "access-control", label: messages.navigationGroups.accessControl }], path: "/admin/iam/policies", requiredPermissions: ["iam.policies.read"] },
      ...oauthRoutes,
      {
        Component: createLazyRoute(LazyIamAccountBindingRoute, dependencies),
        description: messages.routes.accountBinding.description,
        id: "iam.account-binding",
        label: messages.routes.accountBinding.label,
        navigationGroups: [{ id: "connections-federation", label: messages.navigationGroups.federation }],
        path: "/admin/iam/account-binding",
        requiredPermissions: ["iam.account_binding_policy.read"],
      },
      {
        Component: createLazyRoute(LazyIamAuditRoute, dependencies),
        description: messages.routes.audit.description,
        id: "iam.audit",
        label: messages.routes.audit.label,
        navigationGroups: [{ id: "security-audit", label: messages.navigationGroups.security }],
        path: "/admin/iam/audit",
        requiredPermissions: ["iam.audit_events.read"],
      },
    ],
    surface: "backend-admin",
  };
}

export * from "./i18n";
