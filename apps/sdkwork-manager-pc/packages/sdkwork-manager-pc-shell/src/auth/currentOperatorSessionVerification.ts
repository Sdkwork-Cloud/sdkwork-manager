type OperatorSessionIdentity = {
  accessToken?: string;
  authToken?: string;
};

let pendingVerification: { key: string; promise: Promise<void> } | null = null;
let verifiedSessionKey: string | null = null;
let verificationGeneration = 0;

export function resolveOperatorSessionVerificationKey(
  session: OperatorSessionIdentity | null | undefined,
): string | null {
  const accessToken = session?.accessToken?.trim();
  const authToken = session?.authToken?.trim();
  return accessToken && authToken ? `${authToken}\u0000${accessToken}` : null;
}

export function isCurrentOperatorSessionVerified(sessionKey: string | null): boolean {
  return Boolean(sessionKey && verifiedSessionKey === sessionKey);
}

export function invalidateCurrentOperatorSessionVerification(): void {
  verificationGeneration += 1;
  pendingVerification = null;
  verifiedSessionKey = null;
}

export function verifyCurrentOperatorSession(
  sessionKey: string,
  retrieveCurrentSession: () => Promise<unknown>,
  resolveCurrentSessionKey: () => string | null,
): Promise<void> {
  if (verifiedSessionKey === sessionKey) {
    return Promise.resolve();
  }
  if (pendingVerification?.key === sessionKey) {
    return pendingVerification.promise;
  }

  const generation = verificationGeneration;
  const promise = retrieveCurrentSession()
    .then(() => undefined)
    .finally(() => {
      if (pendingVerification?.promise === promise) {
        pendingVerification = null;
      }
    });
  pendingVerification = { key: sessionKey, promise };
  void promise.then(
    () => {
      if (generation === verificationGeneration) {
        verifiedSessionKey = resolveCurrentSessionKey() ?? sessionKey;
      }
    },
    () => undefined,
  );

  return promise;
}
