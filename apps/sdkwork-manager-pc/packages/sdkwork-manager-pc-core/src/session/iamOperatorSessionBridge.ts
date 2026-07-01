import type { IamAppContext } from "@sdkwork/iam-contracts";

import type { OperatorSession } from "@sdkwork/manager-client-core";
import {
  normalizeOperatorSession,
  saveOperatorSessionToStorage,
} from "@sdkwork/manager-client-core";

export const MANAGER_IAM_SESSION_STORAGE_KEY = "sdkwork-manager-pc:iam-session:v1";

const MANAGER_IAM_SESSION_FULL_KEY = `${MANAGER_IAM_SESSION_STORAGE_KEY}:full`;

export interface ManagerIamSession {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  sessionId?: string;
  context?: IamAppContext;
  user?: unknown;
}

export function toOperatorSession(
  session: ManagerIamSession | null | undefined,
): OperatorSession | null {
  if (!session) {
    return null;
  }
  return normalizeOperatorSession({
    accessToken: session.accessToken,
    authToken: session.authToken,
    tenantId: session.context?.tenantId,
    organizationId: session.context?.organizationId,
    userId: session.context?.userId,
  });
}

function browserSessionStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.sessionStorage;
}

export function loadManagerIamSession(): ManagerIamSession | null {
  const storage = browserSessionStorage();
  if (!storage) {
    return null;
  }
  const full = storage.getItem(MANAGER_IAM_SESSION_FULL_KEY);
  if (full) {
    try {
      return JSON.parse(full) as ManagerIamSession;
    } catch {
      return null;
    }
  }
  return null;
}

export function commitManagerIamSession(session: ManagerIamSession | null): ManagerIamSession | null {
  saveManagerIamSession(session);
  return session;
}

export function saveManagerIamSession(session: ManagerIamSession | null): void {
  const storage = browserSessionStorage();
  const operator = toOperatorSession(session);
  saveOperatorSessionToStorage(MANAGER_IAM_SESSION_STORAGE_KEY, operator);
  if (!storage) {
    return;
  }
  if (!session) {
    storage.removeItem(MANAGER_IAM_SESSION_FULL_KEY);
    return;
  }
  storage.setItem(MANAGER_IAM_SESSION_FULL_KEY, JSON.stringify(session));
}

export function clearManagerIamSession(): void {
  saveManagerIamSession(null);
}
