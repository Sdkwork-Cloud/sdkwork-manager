import {
  hasPermissionInScope,
  SDKWORK_STANDARD_ROLE_CODES,
  type IamAppContext,
} from "@sdkwork/iam-contracts";
import { deepEqual } from "@sdkwork/utils";

import type { OperatorSession } from "@sdkwork/manager-client-core";
import { normalizeOperatorSession } from "@sdkwork/manager-client-core";

import {
  notifyOperatorSessionChanged,
  notifyOperatorSessionStorageChanged,
} from "./sessionEvents";

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
  const committedSession = mergeRuntimeSessionCommit(loadManagerIamSession(), session);
  saveManagerIamSession(committedSession);
  return committedSession;
}

export function saveManagerIamSession(session: ManagerIamSession | null): void {
  if (deepEqual(memorySession, session)) {
    return;
  }
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

function mergeRuntimeSessionCommit(
  currentSession: ManagerIamSession | null,
  nextSession: ManagerIamSession | null,
): ManagerIamSession | null {
  if (
    !currentSession
    || !nextSession
    || currentSession.accessToken !== nextSession.accessToken
    || currentSession.authToken !== nextSession.authToken
  ) {
    return nextSession;
  }

  // IAM commits tokens before the current AppContext. Do not expose that
  // intermediate token-only write as an application or cross-tab change.
  return {
    ...nextSession,
    ...(nextSession.context === undefined && currentSession.context
      ? { context: currentSession.context }
      : {}),
    ...(nextSession.sessionId === undefined && currentSession.sessionId
      ? { sessionId: currentSession.sessionId }
      : {}),
    ...(nextSession.user === undefined && currentSession.user !== undefined
      ? { user: currentSession.user }
      : {}),
  };
}
export function getManagerPermissionScope(): readonly string[] {
  return [...(loadManagerIamSession()?.context?.permissionScope ?? [])];
}

export function getManagerStandardRoleCodes(): readonly string[] {
  return [...(loadManagerIamSession()?.context?.standardRoleCodes ?? [])];
}

export function isManagerPlatformSuperAdmin(): boolean {
  return getManagerStandardRoleCodes().some(
    (roleCode) => typeof roleCode === "string"
      && roleCode.toLowerCase() === SDKWORK_STANDARD_ROLE_CODES.PLATFORM_SUPER_ADMIN,
  );
}

export function hasManagerPermission(permission: string): boolean {
  return isManagerPlatformSuperAdmin()
    || hasPermissionInScope(getManagerPermissionScope(), permission);
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
    notifyOperatorSessionStorageChanged();
  });
}
