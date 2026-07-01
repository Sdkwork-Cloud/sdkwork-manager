use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::{ManagerPreference, ManagerPreferenceSummary, UpdateManagerPreferenceCommand};

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
}
