import type { ComponentType } from "react";
import { hasPermissionInScope } from "@sdkwork/iam-contracts";

export type AdminModuleAccess = {
  requiredPermissions?: readonly string[];
  permissionMode?: "all" | "any";
};

export type AdminModuleCommercialOffer = {
  entitlementKey: string;
  releaseChannel: "stable" | "preview";
  tier: "foundation" | "standard" | "professional" | "enterprise";
};

export type AdminModuleAccessScope = {
  permissionScope: readonly string[];
};

export type AdminModuleHeaderAction = {
  disabled?: boolean;
  id: string;
  label: string;
  onSelect?: () => void;
  variant?: "primary" | "secondary";
};

export type AdminModuleRoute = {
  Component: ComponentType;
  description?: string;
  id: string;
  label: string;
  navigationVisible?: boolean;
  path: string;
  permissionMode?: "all" | "any";
  requiredPermissions?: readonly string[];
};

export type AdminModuleHeaderSlotProps = {
  activeRoute?: AdminModuleRoute;
  module: AdminModuleContribution;
  pathname: string;
};

export type AdminModuleHeader = {
  actions?: readonly AdminModuleHeaderAction[];
  Context?: ComponentType<AdminModuleHeaderSlotProps>;
  description: string;
  title: string;
};

export type AdminModuleContribution = {
  access: AdminModuleAccess;
  capability: string;
  commercial: AdminModuleCommercialOffer;
  defaultPath: string;
  displayName: string;
  domain: string;
  header: AdminModuleHeader;
  id: string;
  packageName: string;
  pathPrefix: string;
  routes: readonly AdminModuleRoute[];
  surface: "backend-admin";
};

export type AdminModuleRegistry = {
  findModuleForPath: (pathname: string) => AdminModuleContribution | undefined;
  findRouteForPath: (pathname: string) => AdminModuleRoute | undefined;
  hasModuleAccess: (module: AdminModuleContribution, scope: AdminModuleAccessScope) => boolean;
  hasRouteAccess: (route: AdminModuleRoute, scope: AdminModuleAccessScope) => boolean;
  listModules: () => readonly AdminModuleContribution[];
  listVisibleModules: (scope: AdminModuleAccessScope) => readonly AdminModuleContribution[];
  listRoutes: () => readonly AdminModuleRoute[];
  listVisibleRoutes: (
    module: AdminModuleContribution,
    scope: AdminModuleAccessScope,
  ) => readonly AdminModuleRoute[];
  resolveDefaultPath: (scope?: AdminModuleAccessScope) => string;
  resolveModuleDefaultPath: (
    module: AdminModuleContribution,
    scope?: AdminModuleAccessScope,
  ) => string;
};

const MODULE_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function routePathMatches(routePath: string, pathname: string): boolean {
  const routeSegments = normalizePath(routePath).split("/").filter(Boolean);
  const pathnameSegments = normalizePath(pathname).split("/").filter(Boolean);
  return routeSegments.length === pathnameSegments.length && routeSegments.every(
    (segment, index) => segment.startsWith(":") || segment === pathnameSegments[index],
  );
}

function assertModuleContribution(module: AdminModuleContribution): void {
  if (!MODULE_ID_PATTERN.test(module.id)) {
    throw new Error(`Admin module id must be lowercase and namespaced: ${module.id}`);
  }
  if (module.surface !== "backend-admin") {
    throw new Error(`Admin module ${module.id} must use the backend-admin surface.`);
  }
  if (!module.pathPrefix.startsWith("/admin/")) {
    throw new Error(`Admin module ${module.id} must reserve an /admin/ path prefix.`);
  }
  if (!module.routes.length) {
    throw new Error(`Admin module ${module.id} must contribute at least one route.`);
  }
  if (!module.routes.some((route) => normalizePath(route.path) === normalizePath(module.defaultPath))) {
    throw new Error(`Admin module ${module.id} defaultPath must match one contributed route.`);
  }
  for (const route of module.routes) {
    if (!route.path.startsWith(`${normalizePath(module.pathPrefix)}/`) && normalizePath(route.path) !== normalizePath(module.pathPrefix)) {
      throw new Error(`Route ${route.id} must remain inside module prefix ${module.pathPrefix}.`);
    }
  }
}

export function createAdminModuleAccessScope(
  input: Partial<AdminModuleAccessScope> = {},
): AdminModuleAccessScope {
  return {
    permissionScope: input.permissionScope ?? [],
  };
}

export function hasAdminModuleAccess(
  module: AdminModuleContribution,
  scope: AdminModuleAccessScope,
): boolean {
  const requiredPermissions = module.access.requiredPermissions ?? [];
  if (!requiredPermissions.length) {
    return true;
  }
  if (module.access.permissionMode === "all") {
    return requiredPermissions.every((permission) =>
      hasPermissionInScope(scope.permissionScope, permission),
    );
  }
  return requiredPermissions.some((permission) =>
    hasPermissionInScope(scope.permissionScope, permission),
  );
}

export function hasAdminRouteAccess(
  route: AdminModuleRoute,
  scope: AdminModuleAccessScope,
): boolean {
  const requiredPermissions = route.requiredPermissions ?? [];
  if (!requiredPermissions.length) {
    return true;
  }
  if (route.permissionMode === "all") {
    return requiredPermissions.every((permission) =>
      hasPermissionInScope(scope.permissionScope, permission),
    );
  }
  return requiredPermissions.some((permission) =>
    hasPermissionInScope(scope.permissionScope, permission),
  );
}

function listAccessibleModuleRoutes(
  module: AdminModuleContribution,
  scope?: AdminModuleAccessScope,
): readonly AdminModuleRoute[] {
  const accessibleRoutes = scope
    ? module.routes.filter((route) => hasAdminRouteAccess(route, scope))
    : module.routes;
  return accessibleRoutes.filter((route) => route.navigationVisible !== false);
}

function resolveAccessibleModuleDefaultPath(
  module: AdminModuleContribution,
  scope?: AdminModuleAccessScope,
): string {
  const candidateRoutes = listAccessibleModuleRoutes(module, scope);
  const configuredDefaultRoute = candidateRoutes.find(
    (route) => normalizePath(route.path) === normalizePath(module.defaultPath),
  );
  return configuredDefaultRoute?.path ?? candidateRoutes[0]?.path ?? "/";
}

export function createSdkworkCoreModuleRegistry(
  contributions: readonly AdminModuleContribution[],
): AdminModuleRegistry {
  const moduleIds = new Set<string>();
  const modulePrefixes = new Set<string>();
  const routePaths = new Set<string>();
  const modules = contributions.map((module) => {
    assertModuleContribution(module);
    if (moduleIds.has(module.id)) {
      throw new Error(`Duplicate admin module id: ${module.id}`);
    }
    moduleIds.add(module.id);
    const modulePrefix = normalizePath(module.pathPrefix);
    for (const registeredPrefix of modulePrefixes) {
      if (
        modulePrefix === registeredPrefix
        || modulePrefix.startsWith(`${registeredPrefix}/`)
        || registeredPrefix.startsWith(`${modulePrefix}/`)
      ) {
        throw new Error(`Overlapping admin module path prefix: ${modulePrefix}`);
      }
    }
    modulePrefixes.add(modulePrefix);
    for (const route of module.routes) {
      const routePath = normalizePath(route.path);
      if (routePaths.has(routePath)) {
        throw new Error(`Duplicate admin route path: ${routePath}`);
      }
      routePaths.add(routePath);
    }
    return module;
  });
  const routes = modules.flatMap((module) => module.routes);

  return {
    findModuleForPath: (pathname) => {
      const normalizedPathname = normalizePath(pathname);
      return modules.find((module) => {
        const prefix = normalizePath(module.pathPrefix);
        return normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`);
      });
    },
    findRouteForPath: (pathname) => {
      const normalizedPathname = normalizePath(pathname);
      return routes.find((route) => normalizePath(route.path) === normalizedPathname)
        ?? routes.find((route) => routePathMatches(route.path, normalizedPathname));
    },
    hasModuleAccess: (module, scope) => hasAdminModuleAccess(module, scope),
    hasRouteAccess: (route, scope) => hasAdminRouteAccess(route, scope),
    listModules: () => modules,
    listVisibleModules: (scope) => modules.filter(
      (module) => hasAdminModuleAccess(module, scope)
        && listAccessibleModuleRoutes(module, scope).length > 0,
    ),
    listRoutes: () => routes,
    listVisibleRoutes: (module, scope) => listAccessibleModuleRoutes(module, scope),
    resolveDefaultPath: (scope) => {
      const candidateModules = scope
        ? modules.filter(
          (module) => hasAdminModuleAccess(module, scope)
            && listAccessibleModuleRoutes(module, scope).length > 0,
        )
        : modules;
      const defaultModule = candidateModules[0];
      if (!defaultModule) {
        return "/";
      }
      return resolveAccessibleModuleDefaultPath(defaultModule, scope);
    },
    resolveModuleDefaultPath: (module, scope) => resolveAccessibleModuleDefaultPath(module, scope),
  };
}
