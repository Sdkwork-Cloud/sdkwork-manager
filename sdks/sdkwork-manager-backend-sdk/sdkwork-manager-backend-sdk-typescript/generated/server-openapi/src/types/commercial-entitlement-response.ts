import type { CommercialEntitlementItem } from './commercial-entitlement-item';

export interface CommercialEntitlementResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
