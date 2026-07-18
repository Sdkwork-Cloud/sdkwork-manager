export const OPERATOR_SESSION_CHANGED_EVENT = "sdkwork-manager-pc:session-changed";
export const OPERATOR_SESSION_STORAGE_CHANGED_EVENT = "sdkwork-manager-pc:session-storage-changed";

export function notifyOperatorSessionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPERATOR_SESSION_CHANGED_EVENT));
  }
}

export function notifyOperatorSessionStorageChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPERATOR_SESSION_STORAGE_CHANGED_EVENT));
  }
}
