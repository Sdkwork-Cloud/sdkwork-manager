import { describe, expect, it } from "vitest";
import { IAM_PC_ADMIN_ORGANIZATION_ROUTES } from "@sdkwork/iam-pc-admin-organization";
import {
  createAdminModuleAccessScope,
  createSdkworkCoreModuleRegistry,
} from "@sdkwork/manager-pc-core";

import { createSdkworkManagerIamAdminContribution } from "../src/index";

describe("manager IAM organization structure route", () => {
  it("contributes a hidden organization-scoped route with all read permissions", () => {
    const contribution = createSdkworkManagerIamAdminContribution({
      getPermissionScope: () => ["iam.organizations.read", "iam.departments.read", "iam.assignments.read"],
      getService: () => ({}) as never,
      getTenantId: () => "tenant-test",
      locale: "zh-CN",
    });
    const route = contribution.routes.find((item) => item.id === "iam.organizations.structure");

    expect(route).toMatchObject({
      label: "组织结构",
      navigationVisible: false,
      path: IAM_PC_ADMIN_ORGANIZATION_ROUTES.structurePath,
      permissionMode: IAM_PC_ADMIN_ORGANIZATION_ROUTES.structurePermissionMode,
      requiredPermissions: IAM_PC_ADMIN_ORGANIZATION_ROUTES.structureRequiredPermissions,
    });

    const registry = createSdkworkCoreModuleRegistry([contribution]);
    expect(registry.hasRouteAccess(route!, createAdminModuleAccessScope({
      permissionScope: ["iam.*"],
    }))).toBe(true);
    expect(registry.hasRouteAccess(route!, createAdminModuleAccessScope({
      permissionScope: ["iam.organizations.read", "iam.departments.read"],
    }))).toBe(false);
  });

  it("allows permission-catalog readers to discover the IAM module", () => {
    const contribution = createSdkworkManagerIamAdminContribution({
      getPermissionScope: () => ["iam.permissions.read"],
      getService: () => ({}) as never,
      getTenantId: () => "tenant-test",
    });
    const registry = createSdkworkCoreModuleRegistry([contribution]);

    expect(contribution.access.requiredPermissions).toContain("iam.permissions.read");
    expect(registry.hasModuleAccess(contribution, createAdminModuleAccessScope({
      permissionScope: ["iam.permissions.read"],
    }))).toBe(true);
  });
});
