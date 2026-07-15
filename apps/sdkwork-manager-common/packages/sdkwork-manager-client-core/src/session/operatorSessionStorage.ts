import { isBlank } from "@sdkwork/utils";

export interface OperatorSession {
  authToken?: string;
  accessToken?: string;
  tenantId?: string;
  organizationId?: string;
  userId?: string;
}

function normalizeToken(value: unknown): string | undefined {
  return typeof value === "string" && !isBlank(value) ? value.trim() : undefined;
}

export function normalizeOperatorSession(raw: Partial<OperatorSession>): OperatorSession | null {
  const accessToken = normalizeToken(raw.accessToken);
  const authToken = normalizeToken(raw.authToken);
  if (!accessToken && !authToken) {
    return null;
  }
  return {
    ...(accessToken ? { accessToken } : {}),
    ...(authToken ? { authToken } : {}),
    ...(normalizeToken(raw.tenantId) ? { tenantId: raw.tenantId!.trim() } : {}),
    ...(normalizeToken(raw.organizationId) ? { organizationId: raw.organizationId!.trim() } : {}),
    ...(normalizeToken(raw.userId) ? { userId: raw.userId!.trim() } : {}),
  };
}
