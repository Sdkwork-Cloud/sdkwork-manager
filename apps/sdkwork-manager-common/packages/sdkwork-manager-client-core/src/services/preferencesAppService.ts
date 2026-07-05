import type { ManagerPreferences, UpdateManagerPreferencesInput } from "@sdkwork/manager-contracts";
import { isBlank } from "@sdkwork/utils";
import type { SdkworkAppClient } from "@sdkwork/manager-app-sdk";

function readPreferenceFields(item: Record<string, unknown>): ManagerPreferences | null {
  const pinnedAppKeys = Array.isArray(item.pinnedAppKeys)
    ? item.pinnedAppKeys.filter((key): key is string => typeof key === "string")
    : [];
  const theme = typeof item.theme === "string" && !isBlank(item.theme) ? item.theme : "system";
  return { pinnedAppKeys, theme };
}

function readPreferenceItem(payload: unknown): ManagerPreferences | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const nestedItem = record.item;
  if (nestedItem && typeof nestedItem === "object") {
    return readPreferenceFields(nestedItem as Record<string, unknown>);
  }
  const data = record.data;
  if (data && typeof data === "object") {
    const dataItem = (data as Record<string, unknown>).item;
    if (dataItem && typeof dataItem === "object") {
      return readPreferenceFields(dataItem as Record<string, unknown>);
    }
  }
  return readPreferenceFields(record);
}

export async function retrieveManagerPreferences(
  client: SdkworkAppClient,
): Promise<ManagerPreferences> {
  const response = await client.manager.preferences.retrieve();
  const item = readPreferenceItem(response);
  if (!item) {
    throw new Error("Preferences response missing data.item");
  }
  return item;
}

export async function updateManagerPreferences(
  client: SdkworkAppClient,
  input: UpdateManagerPreferencesInput,
): Promise<ManagerPreferences> {
  const response = await client.manager.preferences.update({
    pinnedAppKeys: input.pinnedAppKeys,
    theme: input.theme,
  });
  const item = readPreferenceItem(response);
  if (!item) {
    throw new Error("Preferences response missing data.item");
  }
  return item;
}
