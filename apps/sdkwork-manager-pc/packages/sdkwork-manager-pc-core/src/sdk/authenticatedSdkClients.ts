import { getAppbaseAppSdkClient, resetAppbaseAppSdkClient } from "./appbaseAppSdkClient";
import {
  OPERATOR_SESSION_CHANGED_EVENT,
  syncOperatorTokenManagerFromIamSession,
} from "../session/operatorSession";

type AuthenticatedSdkCacheResetter = () => void;

const authenticatedSdkCacheResetters = new Set<AuthenticatedSdkCacheResetter>();

export function getManagerAuthenticatedSdkClients() {
  return [getAppbaseAppSdkClient()];
}

/**
 * Backend-admin SDK packages register only their cache resetter here. The
 * core owns the session boundary, so no package can retain a client from a
 * previous IAM session.
 */
export function registerManagerAuthenticatedSdkCacheResetter(
  resetter: AuthenticatedSdkCacheResetter,
): () => void {
  authenticatedSdkCacheResetters.add(resetter);
  return () => {
    authenticatedSdkCacheResetters.delete(resetter);
  };
}

export function resetManagerAuthenticatedSdkClients(): void {
  syncOperatorTokenManagerFromIamSession();
  resetAppbaseAppSdkClient();
  for (const resetter of authenticatedSdkCacheResetters) {
    resetter();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, () => {
    resetManagerAuthenticatedSdkClients();
  });
}
