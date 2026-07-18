export const MANAGER_SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;

export type ManagerLocale = (typeof MANAGER_SUPPORTED_LOCALES)[number];

const DEFAULT_MANAGER_LOCALE: ManagerLocale = "zh-CN";

let currentManagerLocale: ManagerLocale = DEFAULT_MANAGER_LOCALE;

export function normalizeManagerLocale(value: string | null | undefined): ManagerLocale | undefined {
  const normalized = value?.trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) {
    return undefined;
  }
  if (normalized === "zh" || normalized.startsWith("zh-")) {
    return "zh-CN";
  }
  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en-US";
  }
  return undefined;
}

export function resolveManagerLocale(
  candidates: readonly (string | null | undefined)[],
  fallbackLocale: ManagerLocale = DEFAULT_MANAGER_LOCALE,
): ManagerLocale {
  for (const candidate of candidates) {
    const locale = normalizeManagerLocale(candidate);
    if (locale) {
      return locale;
    }
  }
  return fallbackLocale;
}

export function getManagerLocale(): ManagerLocale {
  return currentManagerLocale;
}

export function setManagerLocale(locale: string | null | undefined): ManagerLocale {
  currentManagerLocale = resolveManagerLocale([locale], DEFAULT_MANAGER_LOCALE);
  return currentManagerLocale;
}
