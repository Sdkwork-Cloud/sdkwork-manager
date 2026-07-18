use sdkwork_utils_rust::{PageInfo, PageMode, SdkWorkPageData, SdkWorkResourceData};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagerPreferenceItem {
    pub pinned_app_keys: Vec<String>,
    pub theme: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPreferenceItem {
    pub user_id: Uuid,
    pub theme: String,
    pub pinned_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommercialEntitlementItem {
    pub app_id: String,
    pub entitlement_keys: Vec<String>,
    pub tier: String,
    pub status: String,
    pub valid_until: Option<chrono::DateTime<chrono::Utc>>,
    pub version: String,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommercialEntitlementDecisionItem {
    pub accepted: bool,
    pub allowed: bool,
    pub app_id: String,
    pub entitlement_key: String,
    pub reason: String,
    pub status: String,
    pub tier: String,
    pub snapshot_version: String,
    pub valid_until: Option<chrono::DateTime<chrono::Utc>>,
}

pub fn preference_resource(
    item: ManagerPreferenceItem,
) -> SdkWorkResourceData<ManagerPreferenceItem> {
    SdkWorkResourceData { item }
}

pub fn commercial_entitlement_resource(
    item: CommercialEntitlementItem,
) -> SdkWorkResourceData<CommercialEntitlementItem> {
    SdkWorkResourceData { item }
}

pub fn admin_preference_page(
    items: Vec<AdminPreferenceItem>,
) -> SdkWorkPageData<AdminPreferenceItem> {
    let total = items.len() as i64;
    let page_size = total.max(1) as i32;
    SdkWorkPageData {
        items,
        page_info: PageInfo {
            mode: PageMode::Offset,
            page: Some(1),
            page_size: Some(page_size),
            total_items: Some(total.to_string()),
            total_pages: Some(1),
            next_cursor: None,
            has_more: Some(false),
        },
    }
}
