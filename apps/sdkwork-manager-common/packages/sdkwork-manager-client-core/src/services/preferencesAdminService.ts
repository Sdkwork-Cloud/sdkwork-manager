import type { AdminPreferenceSummary } from "@sdkwork/manager-contracts";
import type { SdkWorkPageData } from "@sdkwork/utils";
import type { SdkworkBackendClient } from "sdkwork-manager-backend-sdk-generated-typescript";

function isAdminPreferenceSummary(value: unknown): value is AdminPreferenceSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.userId === "string" && typeof record.theme === "string";
}

function readAdminPreferencePage(payload: unknown): AdminPreferenceSummary[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];
  return items.filter(isAdminPreferenceSummary);
}

export async function listAdminPreferences(
  client: SdkworkBackendClient,
): Promise<AdminPreferenceSummary[]> {
  const response = await client.manager.preferences.admin.list();
  if (response && typeof response === "object" && Array.isArray((response as SdkWorkPageData<AdminPreferenceSummary>).items)) {
    return (response as SdkWorkPageData<AdminPreferenceSummary>).items;
  }
  return readAdminPreferencePage(response);
}
