import type { PageInfo } from './page-info';

export interface ManagerPreferencesAdminListResponse {
  code: 0;
  data: unknown & { items: { userId: string; theme: string; pinnedCount: number; }[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
