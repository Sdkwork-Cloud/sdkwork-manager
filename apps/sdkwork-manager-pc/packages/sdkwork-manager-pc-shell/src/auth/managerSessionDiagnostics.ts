const SESSION_CHECK_QUERY_PARAMETER = "managerSessionCheck";
const SESSION_DEBUG_QUERY_PARAMETER = "managerSessionDebug";
const SESSION_PAGE_BOOT_STORAGE_KEY = "sdkwork-manager-pc:session-debug-page-boot";

export interface ManagerSessionDiagnostics {
  debug: boolean;
  pauseValidation: boolean;
}

export function resolveManagerSessionDiagnostics(search: string): ManagerSessionDiagnostics {
  const searchParameters = new URLSearchParams(search);
  const pauseValidation = searchParameters.get(SESSION_CHECK_QUERY_PARAMETER) === "paused";
  return {
    debug: import.meta.env.DEV
      && (pauseValidation || searchParameters.get(SESSION_DEBUG_QUERY_PARAMETER) === "1"),
    pauseValidation: import.meta.env.DEV && pauseValidation,
  };
}

export function logManagerSessionDiagnostic(
  diagnostics: ManagerSessionDiagnostics,
  event: string,
  details: Record<string, boolean | number | string | undefined>,
): void {
  if (!diagnostics.debug) {
    return;
  }
  console.info("[manager-session]", event, details);
}

export function logManagerSessionPageBoot(search: string): void {
  const diagnostics = resolveManagerSessionDiagnostics(search);
  if (!diagnostics.debug || typeof window === "undefined") {
    return;
  }

  const previousBootId = Number.parseInt(
    window.sessionStorage.getItem(SESSION_PAGE_BOOT_STORAGE_KEY) ?? "0",
    10,
  );
  const pageBootId = Number.isFinite(previousBootId) ? previousBootId + 1 : 1;
  window.sessionStorage.setItem(SESSION_PAGE_BOOT_STORAGE_KEY, String(pageBootId));
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  logManagerSessionDiagnostic(diagnostics, "page:boot", {
    navigationType: navigation?.type ?? "unknown",
    pageBootId,
    pathname: window.location.pathname,
  });
}
