import { isBlank, slugify, trim, unique } from "@sdkwork/utils";

import type {
  ManagerPreferences,
  UpdateManagerPreferencesInput,
} from "@sdkwork/manager-contracts";

export function normalizeManagerPreferencesInput(
  input: UpdateManagerPreferencesInput,
): ManagerPreferences {
  const theme = trim(input.theme) || "system";
  if (isBlank(theme)) {
    throw new Error("manager theme is required");
  }

  const pinnedAppKeys = unique(
    input.pinnedAppKeys
      .map((key) => slugify(trim(key)))
      .filter((key) => !isBlank(key)),
  );

  return { pinnedAppKeys, theme };
}

export function formatManagerHeadline(preferences: ManagerPreferences): string {
  const count = preferences.pinnedAppKeys.length;
  return `Manager (${preferences.theme}, ${count} pinned apps)`;
}
