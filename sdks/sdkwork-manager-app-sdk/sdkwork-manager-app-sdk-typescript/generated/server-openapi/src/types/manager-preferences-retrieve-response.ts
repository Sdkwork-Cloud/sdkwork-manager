export interface ManagerPreferencesRetrieveResponse {
  code: 0;
  data: unknown & { item: { pinnedAppKeys: string[]; theme: string; }; };
  /** Server-owned request correlation id. */
  traceId: string;
}
