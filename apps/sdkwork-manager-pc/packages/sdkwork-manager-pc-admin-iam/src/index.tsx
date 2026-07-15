import { lazy, Suspense, useMemo, type ComponentType } from "react";
import type {
  AdminModuleContribution,
  AdminModuleHeaderSlotProps,
} from "@sdkwork/manager-pc-core";
import type { SdkworkIamService } from "@sdkwork/iam-service";

type IamRouteDependencies = {
  getPermissionScope: () => readonly string[];
  getService: () => SdkworkIamService;
};

function IamRouteLoadingState() {
  return <div className="manager-module-loading" role="status">Loading IAM admin capability</div>;
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
  return <span className="manager-module-header__context">{module.commercial.releaseChannel} channel</span>;
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

export function createSdkworkManagerIamAdminContribution(
  dependencies: IamRouteDependencies,
): AdminModuleContribution {
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
      tier: "foundation",
    },
    defaultPath: "/admin/iam/users",
    displayName: "Identity & Access",
    domain: "iam",
    header: {
      Context: IamModuleHeaderContext,
      description: "Operator administration for identities, tenant boundaries, access policy, and security audit.",
      title: "Identity & Access",
    },
    id: "iam.identity-access",
    packageName: "@sdkwork/manager-pc-admin-iam",
    pathPrefix: "/admin/iam",
    routes: [
      {
        Component: createLazyRoute(LazyIamUserRoute, dependencies),
        description: "Directory records and lifecycle",
        id: "iam.users",
        label: "Users",
        path: "/admin/iam/users",
        requiredPermissions: ["iam.users.read"],
      },
      {
        Component: createLazyRoute(LazyIamTenantRoute, dependencies),
        description: "Tenant boundaries and members",
        id: "iam.tenants",
        label: "Tenants",
        path: "/admin/iam/tenants",
        requiredPermissions: ["iam.tenants.read"],
      },
      {
        Component: createLazyRoute(LazyIamOrganizationRoute, dependencies),
        description: "Organizations, departments, and memberships",
        id: "iam.organizations",
        label: "Organizations",
        path: "/admin/iam/organizations",
        requiredPermissions: ["iam.organizations.read"],
      },
      {
        Component: createLazyRoute(LazyIamPermissionRoute, dependencies),
        description: "Roles, permissions, policies, and bindings",
        id: "iam.authorization",
        label: "Authorization",
        path: "/admin/iam/authorization",
        requiredPermissions: ["iam.roles.read", "iam.permissions.read"],
      },
      {
        Component: createLazyRoute(LazyIamOauthRoute, dependencies),
        description: "OAuth providers, applications, and grants",
        id: "iam.oauth",
        label: "OAuth",
        path: "/admin/iam/oauth",
        requiredPermissions: ["iam.oauth.read"],
      },
      {
        Component: createLazyRoute(LazyIamAccountBindingRoute, dependencies),
        description: "Contact and identity binding policy",
        id: "iam.account-binding",
        label: "Account binding",
        path: "/admin/iam/account-binding",
        requiredPermissions: ["iam.account_binding_policy.read"],
      },
      {
        Component: createLazyRoute(LazyIamAuditRoute, dependencies),
        description: "Security and administrative audit events",
        id: "iam.audit",
        label: "Audit",
        path: "/admin/iam/audit",
        requiredPermissions: ["iam.audit_events.read"],
      },
    ],
    surface: "backend-admin",
  };
}
