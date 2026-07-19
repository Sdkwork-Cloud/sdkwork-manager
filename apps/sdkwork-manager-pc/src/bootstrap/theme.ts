import type {
  SdkworkThemeColor,
  SdkworkThemeSelection,
} from "@sdkwork/ui-pc-react/theme";

export const MANAGER_THEME_STORAGE_KEY = "sdkwork.manager.theme";
export const MANAGER_THEME_COLOR: SdkworkThemeColor = "tech-blue";

function isThemeSelection(value: string | null): value is SdkworkThemeSelection {
  return value === "dark" || value === "light" || value === "system";
}

export function resolveInitialManagerTheme(): SdkworkThemeSelection {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const storedTheme = window.localStorage.getItem(MANAGER_THEME_STORAGE_KEY);
    return isThemeSelection(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

export function commitManagerTheme(theme: SdkworkThemeSelection): SdkworkThemeSelection {
  try {
    window.localStorage.setItem(MANAGER_THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return theme;
}
