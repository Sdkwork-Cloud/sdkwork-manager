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
