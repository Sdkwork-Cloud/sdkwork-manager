const SESSION_CHECK_QUERY_PARAMETER = "managerSessionCheck";
const SESSION_DEBUG_QUERY_PARAMETER = "managerSessionDebug";

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
