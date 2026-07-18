import { describe, expect, it, vi } from "vitest";

import { verifyCurrentOperatorSession } from "../src/auth/currentOperatorSessionVerification";

describe("current operator session verification", () => {
  it("coalesces concurrent homepage verification requests", async () => {
    let resolveRequest: (() => void) | undefined;
    const retrieveCurrentSession = vi.fn(() => new Promise<void>((resolve) => {
      resolveRequest = resolve;
    }));

    const firstVerification = verifyCurrentOperatorSession(retrieveCurrentSession);
    const secondVerification = verifyCurrentOperatorSession(retrieveCurrentSession);

    expect(retrieveCurrentSession).toHaveBeenCalledTimes(1);
    expect(secondVerification).toBe(firstVerification);

    resolveRequest?.();
    await Promise.all([firstVerification, secondVerification]);
  });

  it("allows a later verification after the active request settles", async () => {
    const retrieveCurrentSession = vi.fn().mockResolvedValue(undefined);

    await verifyCurrentOperatorSession(retrieveCurrentSession);
    await verifyCurrentOperatorSession(retrieveCurrentSession);

    expect(retrieveCurrentSession).toHaveBeenCalledTimes(2);
  });
});
