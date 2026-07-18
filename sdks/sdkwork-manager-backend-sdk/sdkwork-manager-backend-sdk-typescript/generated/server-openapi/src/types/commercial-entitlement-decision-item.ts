import type { CommercialEntitlementTier } from './commercial-entitlement-tier';

export interface CommercialEntitlementDecisionItem {
  accepted: true;
  allowed: boolean;
  appId: string;
  entitlementKey: string;
  reason: 'entitlement_active' | 'entitlement_missing' | 'snapshot_inactive' | 'snapshot_expired';
  tier: CommercialEntitlementTier;
  snapshotVersion: string;
  status: 'allowed' | 'denied';
  validUntil?: string;
}
