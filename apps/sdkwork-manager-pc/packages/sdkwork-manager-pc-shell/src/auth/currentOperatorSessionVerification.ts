let pendingVerification: Promise<void> | null = null;

export function verifyCurrentOperatorSession(
  retrieveCurrentSession: () => Promise<unknown>,
): Promise<void> {
  if (!pendingVerification) {
    pendingVerification = retrieveCurrentSession()
      .then(() => undefined)
      .finally(() => {
        pendingVerification = null;
      });
  }

  return pendingVerification;
}
