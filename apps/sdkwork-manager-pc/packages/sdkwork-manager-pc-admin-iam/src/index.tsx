import { lazy, Suspense, useMemo, type ComponentType } from "react";
import type {
  AdminModuleContribution,
  AdminModuleHeaderSlotProps,
} from "@sdkwork/manager-pc-core";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import { createSdkworkIamPermissionController } from "@sdkwork/iam-pc-admin-permission";

import {
  MANAGER_IAM_ADMIN_I18N_CATALOG,
  useManagerIamAdminMessages,
} from "./i18n";
import { IamCatalogWorkspace } from "./authorization/IamCatalogWorkspace";

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
    default: function IamTenantRoute({ getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamTenantController(getService()), [getService]);
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

const LazyIamOauthRoute = lazy(async () => {
  const { createSdkworkIamOauthAdminController, SdkworkIamOauthAdminWorkspace } = await import("@sdkwork/iam-pc-admin-oauth");
  return {
    default: function IamOauthRoute({ getService }: IamRouteDependencies) {
      const controller = useMemo(() => createSdkworkIamOauthAdminController(getService()), [getService]);
      return <SdkworkIamOauthAdminWorkspace controller={controller} />;
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

function IamModuleHeaderContext({ module }: AdminModuleHeaderSlotProps) {
  const messages = useManagerIamAdminMessages().module;
  return (
    <span className="manager-module-header__context">
      {messages.channelTemplate.replace("{channel}", module.commercial.releaseChannel)}
    </span>
  );
}

function createLazyRoute(
  Component: ComponentType<IamRouteDependencies>,
  dependencies: IamRouteDependencies,
) {
  return function IamRouteEntry() {
    return (
      <Suspense fallback={<IamRouteLoadingState />}>
        <Component {...dependencies} />
      </Suspense>
    );
  };
}

function IamCatalogRoute({ dependencies, kind, title, description }: { dependencies: IamRouteDependencies; kind: "role" | "permission" | "policy"; title: string; description: string }) {
  const controller = useMemo(() => createSdkworkIamPermissionController({ permissionScope: dependencies.getPermissionScope(), service: dependencies.getService() }), [dependencies]);
  return <IamCatalogWorkspace controller={controller} description={description} kind={kind} title={title} />;
}

export function createSdkworkManagerIamAdminContribution(
  dependencies: IamContributionDependencies,
): AdminModuleContribution {
  const messages = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages(dependencies.locale).module;
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
      Context: IamModuleHeaderContext,
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
        path: "/admin/iam/users",
        requiredPermissions: ["iam.users.read"],
      },
      {
        Component: createLazyRoute(LazyIamTenantRoute, dependencies),
        description: messages.routes.tenants.description,
        id: "iam.tenants",
        label: messages.routes.tenants.label,
        path: "/admin/iam/tenants",
        requiredPermissions: ["iam.tenants.read"],
      },
      {
        Component: createLazyRoute(LazyIamOrganizationRoute, dependencies),
        description: messages.routes.organizations.description,
        id: "iam.organizations",
        label: messages.routes.organizations.label,
        path: "/admin/iam/organizations",
        requiredPermissions: ["iam.organizations.read"],
      },
      { Component: () => <IamCatalogRoute dependencies={dependencies} description={messages.routes.roles.description} kind="role" title={messages.routes.roles.label} />, description: messages.routes.roles.description, id: "iam.roles", label: messages.routes.roles.label, navigationGroups: [{ id: "access-control", label: "Access control" }], path: "/admin/iam/roles", requiredPermissions: ["iam.roles.read"] },
      { Component: () => <IamCatalogRoute dependencies={dependencies} description={messages.routes.permissions.description} kind="permission" title={messages.routes.permissions.label} />, description: messages.routes.permissions.description, id: "iam.permissions", label: messages.routes.permissions.label, navigationGroups: [{ id: "access-control", label: "Access control" }], path: "/admin/iam/permissions", requiredPermissions: ["iam.permissions.read"] },
      { Component: () => <IamCatalogRoute dependencies={dependencies} description={messages.routes.policies.description} kind="policy" title={messages.routes.policies.label} />, description: messages.routes.policies.description, id: "iam.policies", label: messages.routes.policies.label, navigationGroups: [{ id: "access-control", label: "Access control" }], path: "/admin/iam/policies", requiredPermissions: ["iam.permissions.read"] },
      {
        Component: createLazyRoute(LazyIamOauthRoute, dependencies),
        description: messages.routes.oauth.description,
        id: "iam.oauth",
        label: messages.routes.oauth.label,
        path: "/admin/iam/oauth",
        requiredPermissions: ["iam.oauth.read"],
      },
      {
        Component: createLazyRoute(LazyIamAccountBindingRoute, dependencies),
        description: messages.routes.accountBinding.description,
        id: "iam.account-binding",
        label: messages.routes.accountBinding.label,
        path: "/admin/iam/account-binding",
        requiredPermissions: ["iam.account_binding_policy.read"],
      },
      {
        Component: createLazyRoute(LazyIamAuditRoute, dependencies),
        description: messages.routes.audit.description,
        id: "iam.audit",
        label: messages.routes.audit.label,
        path: "/admin/iam/audit",
        requiredPermissions: ["iam.audit_events.read"],
      },
    ],
    surface: "backend-admin",
  };
}

export * from "./i18n";
