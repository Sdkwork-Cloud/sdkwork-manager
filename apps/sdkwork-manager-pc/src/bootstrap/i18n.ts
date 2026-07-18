import {
  normalizeManagerLocale,
  resolveManagerLocale,
  setManagerLocale,
  type ManagerLocale,
} from "@sdkwork/manager-pc-core";

export const MANAGER_LOCALE_STORAGE_KEY = "sdkwork.manager.locale";

const configuredDefaultLocale = normalizeManagerLocale(
  import.meta.env.VITE_SDKWORK_MANAGER_DEFAULT_LOCALE,
) ?? "zh-CN";
const configuredFallbackLocale = normalizeManagerLocale(
  import.meta.env.VITE_SDKWORK_MANAGER_FALLBACK_LOCALE,
) ?? "en-US";

export const MANAGER_I18N_RUNTIME_CONFIG = {
  activeLocales: ["zh-CN", "en-US"],
  defaultLocale: configuredDefaultLocale,
  fallbackLocale: configuredFallbackLocale,
  loadingStrategy: "eager-core-lazy-feature",
  supportedLocales: ["zh-CN", "en-US"],
} as const;

function readStoredLocale(): string | undefined {
  try {
    return window.localStorage.getItem(MANAGER_LOCALE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function resolveInitialManagerLocale(): ManagerLocale {
  const browserLocales = typeof navigator === "undefined"
    ? []
    : navigator.languages.length
      ? navigator.languages
      : [navigator.language];
  const locale = resolveManagerLocale(
    [
      typeof window === "undefined" ? undefined : readStoredLocale(),
      ...browserLocales,
      MANAGER_I18N_RUNTIME_CONFIG.defaultLocale,
      MANAGER_I18N_RUNTIME_CONFIG.fallbackLocale,
    ],
    MANAGER_I18N_RUNTIME_CONFIG.fallbackLocale,
  );
  return setManagerLocale(locale);
}

export function commitManagerLocale(locale: string): ManagerLocale {
  const normalized = setManagerLocale(locale);
  try {
    window.localStorage.setItem(MANAGER_LOCALE_STORAGE_KEY, normalized);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return normalized;
}
