export type ManagerTheme = "system" | "light" | "dark";

export interface ManagerPreferences {
  pinnedAppKeys: string[];
  theme: ManagerTheme | string;
}

export interface UpdateManagerPreferencesInput {
  pinnedAppKeys: string[];
  theme: string;
}

export interface AdminPreferenceSummary {
  userId: string;
  theme: string;
  pinnedCount: number;
}
