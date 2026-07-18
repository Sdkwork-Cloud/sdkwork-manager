import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  invalidateCurrentOperatorSessionVerification,
  isCurrentOperatorSessionVerified,
  resolveOperatorSessionVerificationKey,
  verifyCurrentOperatorSession,
} from "../src/auth/currentOperatorSessionVerification";

describe("current operator session verification", () => {
  const sessionKey = resolveOperatorSessionVerificationKey({
    accessToken: "access-token",
    authToken: "auth-token",
  })!;

  beforeEach(() => {
    invalidateCurrentOperatorSessionVerification();
  });

  it("coalesces concurrent route-guard verification requests", async () => {
    let resolveRequest: (() => void) | undefined;
    const retrieveCurrentSession = vi.fn(() => new Promise<void>((resolve) => {
      resolveRequest = resolve;
    }));

    const firstVerification = verifyCurrentOperatorSession(sessionKey, retrieveCurrentSession, () => sessionKey);
    const secondVerification = verifyCurrentOperatorSession(sessionKey, retrieveCurrentSession, () => sessionKey);

    expect(retrieveCurrentSession).toHaveBeenCalledTimes(1);
    expect(secondVerification).toBe(firstVerification);

    resolveRequest?.();
    await Promise.all([firstVerification, secondVerification]);
  });

  it("reuses successful verification across guard remounts", async () => {
    const retrieveCurrentSession = vi.fn().mockResolvedValue(undefined);

    await verifyCurrentOperatorSession(sessionKey, retrieveCurrentSession, () => sessionKey);
    await verifyCurrentOperatorSession(sessionKey, retrieveCurrentSession, () => sessionKey);

    expect(retrieveCurrentSession).toHaveBeenCalledTimes(1);
    expect(isCurrentOperatorSessionVerified(sessionKey)).toBe(true);
  });

  it("allows verification again after the session is invalidated", async () => {
    const retrieveCurrentSession = vi.fn().mockResolvedValue(undefined);

    await verifyCurrentOperatorSession(sessionKey, retrieveCurrentSession, () => sessionKey);
    invalidateCurrentOperatorSessionVerification();
    await verifyCurrentOperatorSession(sessionKey, retrieveCurrentSession, () => sessionKey);

    expect(retrieveCurrentSession).toHaveBeenCalledTimes(2);
  });
});
