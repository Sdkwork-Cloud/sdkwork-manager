use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct CommercialEntitlementDecisionItem {
    pub accepted: bool,

    pub allowed: bool,

    #[serde(rename = "appId")]
    pub app_id: String,

    #[serde(rename = "entitlementKey")]
    pub entitlement_key: String,

    pub reason: String,

    pub tier: String,

    #[serde(rename = "snapshotVersion")]
    pub snapshot_version: String,

    pub status: String,

    #[serde(rename = "validUntil")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_until: Option<String>,
}
