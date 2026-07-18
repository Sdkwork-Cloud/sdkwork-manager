import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permissionScope: [] as string[],
}));

vi.mock("@sdkwork/manager-pc-core", () => ({
  getManagerPermissionScope: () => [...mocks.permissionScope],
  OPERATOR_SESSION_CHANGED_EVENT: "sdkwork-manager-pc:session-changed",
  OPERATOR_SESSION_STORAGE_CHANGED_EVENT: "sdkwork-manager-pc:session-storage-changed",
}));

import { useManagerPermissionScope } from "../src/auth/useManagerPermissionScope";

function PermissionScopeProbe() {
  const permissionScope = useManagerPermissionScope();
  return createElement("output", null, permissionScope.join(","));
}

describe("manager permission scope subscription", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.permissionScope = [];
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  it("updates navigation scope when IAM commits a refreshed operator session", async () => {
    await act(async () => {
      root.render(createElement(PermissionScopeProbe));
    });
    expect(container.textContent).toBe("");

    mocks.permissionScope = [
      "iam.users.read",
      "iam.tenants.read",
      "iam.organizations.read",
      "iam.roles.read",
      "iam.permissions.read",
      "iam.oauth.read",
      "iam.account_binding_policy.read",
      "iam.audit_events.read",
    ];
    await act(async () => {
      window.dispatchEvent(new Event("sdkwork-manager-pc:session-changed"));
    });

    expect(container.textContent).toContain("iam.tenants.read");
    expect(container.textContent).toContain("iam.organizations.read");
    expect(container.textContent).toContain("iam.oauth.read");

    await act(async () => root.unmount());
    container.remove();
  });
});
