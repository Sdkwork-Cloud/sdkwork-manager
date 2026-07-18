use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ManagerPreference {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Uuid,
    pub pinned_app_keys: Vec<String>,
    pub theme: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ManagerPreferenceSummary {
    pub user_id: Uuid,
    pub theme: String,
    pub pinned_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct UpdateManagerPreferenceCommand {
    pub tenant_id: Uuid,
    pub user_id: Uuid,
    pub pinned_app_keys: Vec<String>,
    pub theme: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CommercialEntitlementSnapshot {
    pub tenant_id: Uuid,
    pub app_id: String,
    pub entitlement_keys: Vec<String>,
    pub tier: String,
    pub status: String,
    pub valid_until: Option<DateTime<Utc>>,
    pub version: i64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCommercialEntitlementCommand {
    pub tenant_id: Uuid,
    pub app_id: String,
    pub entitlement_keys: Vec<String>,
    pub tier: String,
    pub status: String,
    pub valid_until: Option<DateTime<Utc>>,
    pub expected_version: i64,
    pub updated_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CommercialEntitlementDecision {
    pub allowed: bool,
    pub app_id: String,
    pub entitlement_key: String,
    pub reason: String,
    pub tier: String,
    pub snapshot_version: i64,
    pub valid_until: Option<DateTime<Utc>>,
}
