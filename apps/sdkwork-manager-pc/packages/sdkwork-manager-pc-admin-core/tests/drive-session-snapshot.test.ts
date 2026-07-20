import { beforeEach, describe, expect, it } from "vitest";

import {
  clearManagerIamSession,
  commitManagerIamSession,
} from "@sdkwork/manager-pc-core";

import { getManagerDriveSessionSnapshot } from "../src/sdk";

describe("manager Drive session adapter", () => {
  beforeEach(() => {
    clearManagerIamSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("projects the complete IAM operator context required by Drive admin services", () => {
    commitManagerIamSession({
      accessToken: "access-token",
      authToken: "auth-token",
      context: {
        appId: "sdkwork-manager-pc",
        authLevel: "password",
        dataScope: ["tenant:tenant-1"],
        deploymentMode: "private",
        environment: "dev",
        organizationId: "organization-1",
        permissionScope: ["drive.storage_provider_bindings.read"],
        sessionId: "context-session-1",
        tenantId: "tenant-1",
        userId: "operator-1",
      },
      refreshToken: "refresh-token",
    });

    expect(getManagerDriveSessionSnapshot()).toEqual({
      accessToken: "access-token",
      authToken: "auth-token",
      context: {
        actorId: "operator-1",
        actorKind: "user",
        appId: "sdkwork-manager-pc",
        authLevel: "password",
        dataScope: ["tenant:tenant-1"],
        deploymentMode: "private",
        environment: "dev",
        organizationId: "organization-1",
        permissionScope: ["drive.storage_provider_bindings.read"],
        sessionId: "context-session-1",
        tenantId: "tenant-1",
        userId: "operator-1",
      },
      refreshToken: "refresh-token",
      sessionId: "context-session-1",
      user: { id: "operator-1" },
    });
  });
});
