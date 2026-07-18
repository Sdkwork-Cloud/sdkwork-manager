import type { CommercialEntitlementDecisionItem } from './commercial-entitlement-decision-item';

export interface CommercialEntitlementDecisionResponse {
  code: 0;
  data: unknown & CommercialEntitlementDecisionItem;
  /** Server-owned request correlation id. */
  traceId: string;
}
