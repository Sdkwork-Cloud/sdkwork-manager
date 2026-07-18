import type { CommercialEntitlementStatus } from './commercial-entitlement-status';
import type { CommercialEntitlementTier } from './commercial-entitlement-tier';

export interface CommercialEntitlementItem {
  appId: string;
  entitlementKeys: string[];
  tier: CommercialEntitlementTier;
  status: CommercialEntitlementStatus;
  validUntil?: string;
  version: string;
  updatedAt: string;
}
