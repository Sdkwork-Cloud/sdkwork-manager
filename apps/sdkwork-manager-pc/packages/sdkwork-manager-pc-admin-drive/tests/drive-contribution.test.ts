import { describe, expect, it } from "vitest";

import { createSdkworkManagerDriveAdminContribution } from "../src";

describe("createSdkworkManagerDriveAdminContribution", () => {
  it("registers the Drive backend-admin routes with canonical permissions", () => {
    const contribution = createSdkworkManagerDriveAdminContribution("zh-CN");

    expect(contribution.pathPrefix).toBe("/admin/drive");
    expect(contribution.routes.map((route) => route.path)).toEqual([
      "/admin/drive/storage-providers",
      "/admin/drive/storage-bindings",
      "/admin/drive/quotas",
      "/admin/drive/spaces",
      "/admin/drive/labels",
      "/admin/drive/audit",
      "/admin/drive/maintenance",
      "/admin/drive/download-packages",
    ]);
    expect(contribution.routes[0]?.requiredPermissions).toEqual(["drive.storage.admin"]);
    expect(contribution.routes[6]?.requiredPermissions).toEqual(["drive.maintenance.admin"]);
    expect(contribution.routes.map((route) => route.contentLayout)).toEqual(
      Array.from({ length: 8 }, () => "edge-to-edge"),
    );
    expect(contribution.routes.map((route) => route.navigationGroups?.[0]?.id)).toEqual([
      "infrastructure",
      "infrastructure",
      "governance",
      "governance",
      "governance",
      "operations",
      "operations",
      "operations",
    ]);
  });
});
