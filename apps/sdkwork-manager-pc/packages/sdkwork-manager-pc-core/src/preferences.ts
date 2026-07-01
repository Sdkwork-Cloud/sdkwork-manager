import {
  formatManagerHeadline,
  normalizeManagerPreferencesInput,
} from "@sdkwork/manager-service";

import type { ManagerPreferences } from "@sdkwork/manager-contracts";

export function buildManagerPreferencesDraft(
  input: ManagerPreferences,
): ManagerPreferences {
  return normalizeManagerPreferencesInput(input);
}

export function describeManager(preferences: ManagerPreferences): string {
  return formatManagerHeadline(preferences);
}
