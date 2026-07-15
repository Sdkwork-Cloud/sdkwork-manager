import { beforeEach, describe, expect, it } from "vitest";

import {
  clearManagerIamSession,
  commitManagerIamSession,
  MANAGER_IAM_SESSION_STORAGE_KEY,
  type ManagerIamSession,
} from "../src/session/iamOperatorSessionBridge";
import {
  getOperatorTokenManager,
  resetOperatorTokenManager,
} from "../src/session/operatorSession";

const FULL_SESSION_KEY = `${MANAGER_IAM_SESSION_STORAGE_KEY}:full`;

function createSession(suffix: string): ManagerIamSession {
  return {
    accessToken: `access-${suffix}`,
    authToken: `auth-${suffix}`,
    expiresAt: Date.now() + 60_000,
    refreshToken: `refresh-${suffix}`,
    sessionId: `session-${suffix}`,
  };
}

describe("manager operator TokenManager lifecycle", () => {
  beforeEach(() => {
    clearManagerIamSession();
    resetOperatorTokenManager();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("keeps one TokenManager instance through logout and a later login", () => {
    const tokenManager = getOperatorTokenManager();
    const firstSession = createSession("first");

    commitManagerIamSession(firstSession);
    expect(getOperatorTokenManager()).toBe(tokenManager);
    expect(tokenManager.getTokens()).toMatchObject({
      accessToken: firstSession.accessToken,
      authToken: firstSession.authToken,
      refreshToken: firstSession.refreshToken,
    });

    clearManagerIamSession();
    expect(tokenManager.getTokens()).toEqual({});

    const secondSession = createSession("second");
    commitManagerIamSession(secondSession);
    expect(getOperatorTokenManager()).toBe(tokenManager);
    expect(tokenManager.getTokens()).toMatchObject({
      accessToken: secondSession.accessToken,
      authToken: secondSession.authToken,
      refreshToken: secondSession.refreshToken,
    });
  });

  it("synchronizes the stable TokenManager after a cross-tab session replacement", () => {
    const tokenManager = getOperatorTokenManager();
    const replacementSession = createSession("replacement");

    window.localStorage.setItem(FULL_SESSION_KEY, JSON.stringify(replacementSession));
    window.dispatchEvent(new StorageEvent("storage", { key: FULL_SESSION_KEY }));

    expect(tokenManager.getTokens()).toMatchObject({
      accessToken: replacementSession.accessToken,
      authToken: replacementSession.authToken,
      refreshToken: replacementSession.refreshToken,
    });
  });
});
