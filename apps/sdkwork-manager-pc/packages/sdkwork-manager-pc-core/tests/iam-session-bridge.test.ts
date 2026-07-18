import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearManagerIamSession,
  commitManagerIamSession,
  getManagerPermissionScope,
  getManagerStandardRoleCodes,
  hasManagerPermission,
  isManagerPlatformSuperAdmin,
  loadManagerIamSession,
  MANAGER_IAM_SESSION_STORAGE_KEY,
  type ManagerIamSession,
} from "../src/session/iamOperatorSessionBridge";
import {
  OPERATOR_SESSION_CHANGED_EVENT,
  OPERATOR_SESSION_STORAGE_CHANGED_EVENT,
} from "../src/session/sessionEvents";

const FULL_SESSION_KEY = `${MANAGER_IAM_SESSION_STORAGE_KEY}:full`;

const session: ManagerIamSession = {
  accessToken: "access-token",
  authToken: "auth-token",
  refreshToken: "refresh-token",
  sessionId: "session-1",
};

describe("manager IAM session bridge", () => {
  beforeEach(() => {
    clearManagerIamSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("persists the complete dual-token session and removes legacy copies", () => {
    const sessionChanged = vi.fn();
    const storageChanged = vi.fn();
    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, sessionChanged);
    window.addEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, storageChanged);
    window.sessionStorage.setItem(MANAGER_IAM_SESSION_STORAGE_KEY, "legacy");

    commitManagerIamSession(session);

    expect(JSON.parse(window.localStorage.getItem(FULL_SESSION_KEY) ?? "null")).toEqual(session);
    expect(window.localStorage.getItem(MANAGER_IAM_SESSION_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(MANAGER_IAM_SESSION_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(FULL_SESSION_KEY)).toBeNull();
    expect(loadManagerIamSession()).toEqual(session);
    expect(sessionChanged).toHaveBeenCalledOnce();
    expect(storageChanged).not.toHaveBeenCalled();

    window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, sessionChanged);
    window.removeEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, storageChanged);
  });

  it("migrates a valid legacy sessionStorage session to localStorage", () => {
    const storageChanged = vi.fn();
    window.addEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, storageChanged);
    window.sessionStorage.setItem(FULL_SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new StorageEvent("storage", { key: FULL_SESSION_KEY }));

    expect(loadManagerIamSession()).toEqual(session);
    expect(JSON.parse(window.localStorage.getItem(FULL_SESSION_KEY) ?? "null")).toEqual(session);
    expect(window.sessionStorage.getItem(FULL_SESSION_KEY)).toBeNull();
    expect(storageChanged).toHaveBeenCalledOnce();

    window.removeEventListener(OPERATOR_SESSION_STORAGE_CHANGED_EVENT, storageChanged);
  });

  it("rejects persisted sessions that do not contain both SDKWork tokens", () => {
    window.localStorage.setItem(FULL_SESSION_KEY, JSON.stringify({ authToken: "auth-only" }));
    window.dispatchEvent(new StorageEvent("storage", { key: FULL_SESSION_KEY }));

    expect(loadManagerIamSession()).toBeNull();
  });

  it("does not broadcast an intermediate IAM token commit with the same session identity", () => {
    commitManagerIamSession({
      ...session,
      context: {
        appId: "sdkwork-manager-pc",
        authLevel: "password",
        dataScope: ["tenant:tenant-1"],
        deploymentMode: "private",
        environment: "dev",
        loginScope: "ORGANIZATION",
        organizationId: "organization-1",
        permissionScope: ["commerce.orders.read"],
        sessionId: "session-1",
        tenantId: "tenant-1",
        userId: "user-1",
      },
    });
    const sessionChanged = vi.fn();
    window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, sessionChanged);

    commitManagerIamSession(session);

    expect(getManagerPermissionScope()).toEqual(["commerce.orders.read"]);
    expect(loadManagerIamSession()?.context?.permissionScope).toEqual(["commerce.orders.read"]);
    expect(sessionChanged).not.toHaveBeenCalled();

    window.removeEventListener(OPERATOR_SESSION_CHANGED_EVENT, sessionChanged);
  });
  it("authorizes a platform super administrator without a per-permission scope", () => {
    commitManagerIamSession({
      ...session,
      context: {
        appId: "sdkwork-manager-pc",
        authLevel: "password",
        dataScope: ["tenant:tenant-1"],
        deploymentMode: "private",
        environment: "dev",
        loginScope: "ORGANIZATION",
        organizationId: "organization-1",
        permissionScope: [],
        sessionId: "session-1",
        standardRoleCodes: ["platform_super_admin"],
        tenantId: "tenant-1",
        userId: "user-1",
      },
    });

    expect(getManagerStandardRoleCodes()).toEqual(["platform_super_admin"]);
    expect(isManagerPlatformSuperAdmin()).toBe(true);
    expect(hasManagerPermission("commerce.payments.route_rules.delete")).toBe(true);
  });
});
