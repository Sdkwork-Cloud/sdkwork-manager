import {
  createTokenManager,
  type AuthTokenManager,
  type AuthTokens,
} from "@sdkwork/sdk-common";

import { loadManagerIamSession, toOperatorSession } from "./iamOperatorSessionBridge";
import { OPERATOR_SESSION_CHANGED_EVENT } from "./sessionEvents";
export {
  OPERATOR_SESSION_CHANGED_EVENT,
  OPERATOR_SESSION_STORAGE_CHANGED_EVENT,
} from "./sessionEvents";

export type OperatorSession = {
  accessToken?: string;
  authToken?: string;
  organizationId?: string;
  tenantId?: string;
  userId?: string;
};

export const OPERATOR_SESSION_STORAGE_KEY = "sdkwork-manager-pc:session:v1";

let globalTokenManager: AuthTokenManager | null = null;

export function loadOperatorSession(): OperatorSession | null {
  return toOperatorSession(loadManagerIamSession());
}

export function resetOperatorTokenManager(): void {
  globalTokenManager?.clearTokens();
}

export function clearOperatorTokenManagerTokens(): void {
  globalTokenManager?.clearTokens();
}

export function getOperatorTokenManager(): AuthTokenManager {
  if (!globalTokenManager) {
    globalTokenManager = createTokenManager();
  }
  syncOperatorTokenManagerFromIamSession();
  return globalTokenManager;
}

/**
 * Keep every authenticated SDK bound to one manager object while replacing
 * only its token contents as the IAM-owned browser session changes.
 */
export function syncOperatorTokenManagerFromIamSession(): void {
  if (!globalTokenManager) {
    return;
  }

  const tokens = toAuthTokens(loadManagerIamSession());
  if (tokens.accessToken && tokens.authToken) {
    globalTokenManager.setTokens(tokens);
    return;
  }
  globalTokenManager.clearTokens();
}

function toAuthTokens(session: ReturnType<typeof loadManagerIamSession>): AuthTokens {
  const accessToken = normalizeToken(session?.accessToken);
  const authToken = normalizeToken(session?.authToken);
  if (!accessToken || !authToken || isExpired(session?.expiresAt)) {
    return {};
  }

  const refreshToken = normalizeToken(session?.refreshToken);
  const expiresAt = normalizeExpiresAt(session?.expiresAt);
  return {
    accessToken,
    authToken,
    ...(refreshToken ? { refreshToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
  };
}

function normalizeToken(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function normalizeExpiresAt(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isExpired(value: unknown): boolean {
  const expiresAt = normalizeExpiresAt(value);
  return expiresAt !== undefined && Date.now() >= expiresAt;
}

if (typeof window !== "undefined") {
  window.addEventListener(OPERATOR_SESSION_CHANGED_EVENT, () => {
    syncOperatorTokenManagerFromIamSession();
  });
}
