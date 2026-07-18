use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::{
    CommercialEntitlementSnapshot, ManagerPreference, ManagerPreferenceSummary,
    UpdateCommercialEntitlementCommand, UpdateManagerPreferenceCommand,
};

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ManagerRepositoryError {
    #[error("commercial entitlement version conflict")]
    VersionConflict,
    #[error("manager repository failure: {0}")]
    Storage(String),
}

#[async_trait]
pub trait ManagerRepository: Send + Sync {
    async fn find_by_tenant_and_user(
        &self,
        tenant_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<ManagerPreference>, String>;

    async fn upsert_preference(
        &self,
        command: UpdateManagerPreferenceCommand,
    ) -> Result<ManagerPreference, String>;

    async fn list_for_admin(
        &self,
        tenant_id: Uuid,
    ) -> Result<Vec<ManagerPreferenceSummary>, String>;

    async fn find_commercial_entitlement(
        &self,
        tenant_id: Uuid,
        app_id: &str,
    ) -> Result<Option<CommercialEntitlementSnapshot>, ManagerRepositoryError>;

    async fn replace_commercial_entitlement(
        &self,
        command: UpdateCommercialEntitlementCommand,
    ) -> Result<CommercialEntitlementSnapshot, ManagerRepositoryError>;
}
