export const OPERATOR_SESSION_CHANGED_EVENT = "sdkwork-manager-pc:session-changed";

export function notifyOperatorSessionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPERATOR_SESSION_CHANGED_EVENT));
  }
}
