import type { IamAppContext } from "@sdkwork/iam-contracts";

import type { OperatorSession } from "@sdkwork/manager-client-core";
import { normalizeOperatorSession } from "@sdkwork/manager-client-core";

import { notifyOperatorSessionChanged } from "./sessionEvents";

export const MANAGER_IAM_SESSION_STORAGE_KEY = "sdkwork-manager-pc:iam-session:v1";

const MANAGER_IAM_SESSION_FULL_KEY = `${MANAGER_IAM_SESSION_STORAGE_KEY}:full`;
const LEGACY_OPERATOR_SESSION_STORAGE_KEY = MANAGER_IAM_SESSION_STORAGE_KEY;

let memorySession: ManagerIamSession | null = null;
let storageLoaded = false;

export interface ManagerIamSession {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  expiresAt?: number | string;
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

function readStorage(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch {
    // The in-memory session remains available in restrictive browser contexts.
  }
}

function removeStorage(storage: Storage | undefined, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Nothing to clear when browser storage is unavailable.
  }
}

function parseStoredSession(raw: string | null): ManagerIamSession | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    const session = parsed as ManagerIamSession;
    return session.authToken?.trim() && session.accessToken?.trim() ? session : null;
  } catch {
    return null;
  }
}

function browserLocalStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function browserSessionStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.sessionStorage;
}

export function loadManagerIamSession(): ManagerIamSession | null {
  if (storageLoaded) {
    return memorySession;
  }
  storageLoaded = true;
  const localStorage = browserLocalStorage();
  const sessionStorage = browserSessionStorage();
  const localSession = parseStoredSession(readStorage(localStorage, MANAGER_IAM_SESSION_FULL_KEY));
  if (localSession) {
    memorySession = localSession;
    removeStorage(sessionStorage, MANAGER_IAM_SESSION_FULL_KEY);
    removeStorage(sessionStorage, LEGACY_OPERATOR_SESSION_STORAGE_KEY);
    return memorySession;
  }
  const legacySession = parseStoredSession(readStorage(sessionStorage, MANAGER_IAM_SESSION_FULL_KEY));
  if (legacySession) {
    memorySession = legacySession;
    writeStorage(localStorage, MANAGER_IAM_SESSION_FULL_KEY, JSON.stringify(legacySession));
  }
  removeStorage(sessionStorage, MANAGER_IAM_SESSION_FULL_KEY);
  removeStorage(sessionStorage, LEGACY_OPERATOR_SESSION_STORAGE_KEY);
  removeStorage(localStorage, LEGACY_OPERATOR_SESSION_STORAGE_KEY);
  return memorySession;
}

export function commitManagerIamSession(session: ManagerIamSession | null): ManagerIamSession | null {
  saveManagerIamSession(session);
  return session;
}

export function saveManagerIamSession(session: ManagerIamSession | null): void {
  memorySession = session;
  storageLoaded = true;
  const localStorage = browserLocalStorage();
  const sessionStorage = browserSessionStorage();
  if (!session) {
    removeStorage(localStorage, MANAGER_IAM_SESSION_FULL_KEY);
  } else {
    writeStorage(localStorage, MANAGER_IAM_SESSION_FULL_KEY, JSON.stringify(session));
  }
  removeStorage(localStorage, LEGACY_OPERATOR_SESSION_STORAGE_KEY);
  removeStorage(sessionStorage, MANAGER_IAM_SESSION_FULL_KEY);
  removeStorage(sessionStorage, LEGACY_OPERATOR_SESSION_STORAGE_KEY);
  notifyOperatorSessionChanged();
}

export function clearManagerIamSession(): void {
  saveManagerIamSession(null);
}

export function getManagerPermissionScope(): readonly string[] {
  return [...(loadManagerIamSession()?.context?.permissionScope ?? [])];
}

export function getManagerCommercialEntitlementKeys(): readonly string[] {
  return [];
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (
      event.key !== null
      && event.key !== MANAGER_IAM_SESSION_FULL_KEY
      && event.key !== LEGACY_OPERATOR_SESSION_STORAGE_KEY
    ) {
      return;
    }
    memorySession = null;
    storageLoaded = false;
    loadManagerIamSession();
    notifyOperatorSessionChanged();
  });
}
