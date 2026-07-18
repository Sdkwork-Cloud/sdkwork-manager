use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct UpdateCommercialEntitlementRequest {
    #[serde(rename = "appId")]
    pub app_id: String,

    #[serde(rename = "entitlementKeys")]
    pub entitlement_keys: Vec<String>,

    pub tier: String,

    pub status: String,

    #[serde(rename = "validUntil")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_until: Option<String>,

    #[serde(rename = "expectedVersion")]
    pub expected_version: String,
}
