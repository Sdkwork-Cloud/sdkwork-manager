use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct CommercialEntitlementDecisionRequest {
    #[serde(rename = "appId")]
    pub app_id: String,

    #[serde(rename = "entitlementKey")]
    pub entitlement_key: String,
}
