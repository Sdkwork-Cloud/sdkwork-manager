import { lazy, Suspense, useMemo, type ComponentType } from "react";
import type {
  AdminModuleContribution,
  AdminModuleRoute,
} from "@sdkwork/manager-pc-core";
import type { SdkworkIamOauthAdminView } from "@sdkwork/iam-pc-admin-oauth";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import { createSdkworkIamPermissionController } from "@sdkwork/iam-pc-admin-permission";

import {
  MANAGER_IAM_ADMIN_I18N_CATALOG,
  useManagerIamAdminMessages,
} from "./i18n";
import { IamCatalogWorkspace } from "./authorization/IamCatalogWorkspace";
import { IamOauthOverview } from "./oauth/IamOauthOverview";

type IamRouteDependencies = {
  getPermissionScope: () => readonly string[];
  getService: () => SdkworkIamService;
};

type IamContributionDependencies = IamRouteDependencies & {
  locale?: string | null;
};

function IamRouteLoadingState() {
  const { module } = useManagerIamAdminMessages();
  return <div className="manager-module-loading" role="status">{module.loading}</div>;
}

const LazyIamUserRoute = lazy(async () => {
  const { createSdkworkIamUserAdminController, SdkworkIamUserAdminWorkspace } = await import("@sdkwork/iam-pc-admin-user");
  return {
    default: function IamUserRoute({ getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamUserAdminController(getService()), [getService]);
      return <SdkworkIamUserAdminWorkspace controller={controller} />;
    },
  };
});

const LazyIamTenantRoute = lazy(async () => {
  const { createSdkworkIamTenantController, SdkworkIamTenantAdminWorkspace } = await import("@sdkwork/iam-pc-admin-tenant");
  return {
    default: function IamTenantRoute({ getPermissionScope, getService }: IamRouteDependencies) {
      const controller = useMemo(
        () => createSdkworkIamTenantController({
          permissionScope: getPermissionScope(),
          service: getService(),
        }),
        [getPermissionScope, getService],
      );
      return <SdkworkIamTenantAdminWorkspace controller={controller} />;
    },
  };
});

const LazyIamOrganizationRoute = lazy(async () => {
  const { createSdkworkIamOrganizationController, SdkworkIamOrganizationAdminWorkspace } = await import("@sdkwork/iam-pc-admin-organization");
  return {
    default: function IamOrganizationRoute({ getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamOrganizationController(getService()), [getService]);
      return <SdkworkIamOrganizationAdminWorkspace controller={controller} />;
    },
  };
});

const LazyIamPermissionRoute = lazy(async () => {
  const { createSdkworkIamPermissionController, SdkworkIamPermissionAdminWorkspace } = await import("@sdkwork/iam-pc-admin-permission");
  return {
    default: function IamPermissionRoute({ getPermissionScope, getService }: IamRouteDependencies) {
      const controller = useMemo(
        () => createSdkworkIamPermissionController({
          permissionScope: getPermissionScope(),
          service: getService(),
        }),
        [getPermissionScope, getService],
      );
      return <SdkworkIamPermissionAdminWorkspace controller={controller} />;
    },
  };
});

type IamOauthRouteDependencies = IamRouteDependencies & {
  description: string;
  title: string;
  view: SdkworkIamOauthAdminView;
};

const LazyIamOauthOverviewRoute = lazy(async () => {
  const { createSdkworkIamOauthAdminController } = await import("@sdkwork/iam-pc-admin-oauth");
  return {
    default: function IamOauthRoute({ getService }: IamRouteDependencies) {
      const { module } = useManagerIamAdminMessages();
      const controller = useMemo(() => createSdkworkIamOauthAdminController(getService()), [getService]);
      return <IamOauthOverview controller={controller} messages={module.oauthOverview} />;
    },
  };
});

const LazyIamOauthRoute = lazy(async () => {
  const { createSdkworkIamOauthAdminController, SdkworkIamOauthAdminSettings } = await import("@sdkwork/iam-pc-admin-oauth");
  return {
    default: function IamOauthRoute({ description, getService, title, view }: IamOauthRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamOauthAdminController(getService()), [getService]);
      return (
        <SdkworkIamOauthAdminSettings
          controller={controller}
          description={description}
          title={title}
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

function IamCatalogRoute({ dependencies, kind }: { dependencies: IamRouteDependencies; kind: "role" | "permission" | "policy" }) {
  const { module } = useManagerIamAdminMessages();
  const controller = useMemo(() => createSdkworkIamPermissionController({ permissionScope: dependencies.getPermissionScope(), service: dependencies.getService() }), [dependencies]);
  const routeMessages = kind === "role" ? module.routes.roles : kind === "permission" ? module.routes.permissions : module.routes.policies;
  return <IamCatalogWorkspace controller={controller} description={routeMessages.description} kind={kind} messages={module.catalog} title={routeMessages.label} />;
}

export function createSdkworkManagerIamAdminContribution(
  dependencies: IamContributionDependencies,
): AdminModuleContribution {
  const messages = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages(dependencies.locale).module;
  const oauthNavigationGroups = [{ id: "oauth", label: messages.navigationGroups.oauth }] as const;
  const oauthRoutes: AdminModuleRoute[] = [
    {
      Component: createLazyRoute(LazyIamOauthOverviewRoute, dependencies),
      description: messages.routes.oauth.description,
      id: "iam.oauth.overview",
      label: messages.routes.oauth.label,
      navigationGroups: oauthNavigationGroups,
      path: "/admin/iam/oauth",
      requiredPermissions: ["iam.oauth.read"],
    },
    ...([
      {
        id: "iam.oauth.providers",
        messages: messages.routes.oauthProviders,
        path: "/admin/iam/oauth/providers",
        view: "providers",
      },
      {
        id: "iam.oauth.applications",
        messages: messages.routes.oauthApplications,
        path: "/admin/iam/oauth/applications",
        view: "applications",
      },
      {
        id: "iam.oauth.login-configuration",
        messages: messages.routes.oauthLoginConfiguration,
        path: "/admin/iam/oauth/login-configuration",
        view: "login-configuration",
      },
      {
        id: "iam.oauth.governance",
        messages: messages.routes.oauthGovernance,
        path: "/admin/iam/oauth/governance",
        view: "governance",
      },
      {
        id: "iam.oauth.authorizations",
        messages: messages.routes.oauthAuthorizations,
        path: "/admin/iam/oauth/authorizations",
        view: "authorizations",
      },
      {
        id: "iam.oauth.resources",
        messages: messages.routes.oauthResources,
        path: "/admin/iam/oauth/resources",
        view: "resources",
      },
      {
        id: "iam.oauth.activity",
        messages: messages.routes.oauthActivity,
        path: "/admin/iam/oauth/activity",
        view: "activity",
      },
    ] as const).map(({ id, messages: routeMessages, path, view }) => ({
      Component: createLazyRoute(LazyIamOauthRoute, {
        ...dependencies,
        description: routeMessages.description,
        title: routeMessages.label,
        view,
      }),
      description: routeMessages.description,
      id,
      label: routeMessages.label,
      navigationGroups: oauthNavigationGroups,
      path,
      requiredPermissions: ["iam.oauth.read"],
    })),
  ];
  return {
    access: {
      permissionMode: "any",
      requiredPermissions: [
        "iam.users.read",
        "iam.tenants.read",
        "iam.organizations.read",
        "iam.roles.read",
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
      { Component: () => <IamCatalogRoute dependencies={dependencies} kind="role" />, description: messages.routes.roles.description, id: "iam.roles", label: messages.routes.roles.label, navigationGroups: [{ id: "access-control", label: messages.navigationGroups.accessControl }], path: "/admin/iam/roles", requiredPermissions: ["iam.roles.read"] },
      { Component: () => <IamCatalogRoute dependencies={dependencies} kind="permission" />, description: messages.routes.permissions.description, id: "iam.permissions", label: messages.routes.permissions.label, navigationGroups: [{ id: "access-control", label: messages.navigationGroups.accessControl }], path: "/admin/iam/permissions", requiredPermissions: ["iam.permissions.read"] },
      { Component: () => <IamCatalogRoute dependencies={dependencies} kind="policy" />, description: messages.routes.policies.description, id: "iam.policies", label: messages.routes.policies.label, navigationGroups: [{ id: "access-control", label: messages.navigationGroups.accessControl }], path: "/admin/iam/policies", requiredPermissions: ["iam.permissions.read"] },
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
