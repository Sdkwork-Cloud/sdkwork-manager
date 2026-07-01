use uuid::Uuid;

use crate::domain::{ManagerPreference, ManagerPreferenceSummary, UpdateManagerPreferenceCommand};
use crate::ports::ManagerRepository;

pub struct ManagerService<R: ManagerRepository> {
    repository: R,
}

impl<R: ManagerRepository> ManagerService<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    pub async fn retrieve_preferences(
        &self,
        tenant_id: Uuid,
        user_id: Uuid,
    ) -> Result<ManagerPreference, String> {
        match self
            .repository
            .find_by_tenant_and_user(tenant_id, user_id)
            .await?
        {
            Some(preference) => Ok(preference),
            None => Ok(default_preference(tenant_id, user_id)),
        }
    }

    pub async fn update_preferences(
        &self,
        command: UpdateManagerPreferenceCommand,
    ) -> Result<ManagerPreference, String> {
        if command.theme.trim().is_empty() {
            return Err("manager theme is required".to_owned());
        }
        self.repository.upsert_preference(command).await
    }

    pub async fn list_preferences_for_admin(
        &self,
        tenant_id: Uuid,
    ) -> Result<Vec<ManagerPreferenceSummary>, String> {
        self.repository.list_for_admin(tenant_id).await
    }
}

fn default_preference(tenant_id: Uuid, user_id: Uuid) -> ManagerPreference {
    let now = chrono::Utc::now();
    ManagerPreference {
        id: Uuid::new_v4(),
        tenant_id,
        user_id,
        pinned_app_keys: Vec::new(),
        theme: "system".to_owned(),
        created_at: now,
        updated_at: now,
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Mutex;

    use async_trait::async_trait;
    use chrono::Utc;

    use super::*;
    use crate::domain::ManagerPreference;

    struct MemoryManagerRepository {
        preferences: Mutex<Vec<ManagerPreference>>,
    }

    impl MemoryManagerRepository {
        fn new() -> Self {
            Self {
                preferences: Mutex::new(Vec::new()),
            }
        }
    }

    #[async_trait]
    impl ManagerRepository for MemoryManagerRepository {
        async fn find_by_tenant_and_user(
            &self,
            tenant_id: Uuid,
            user_id: Uuid,
        ) -> Result<Option<ManagerPreference>, String> {
            Ok(self
                .preferences
                .lock()
                .map_err(|_| "lock poisoned".to_owned())?
                .iter()
                .find(|item| item.tenant_id == tenant_id && item.user_id == user_id)
                .cloned())
        }

        async fn upsert_preference(
            &self,
            command: UpdateManagerPreferenceCommand,
        ) -> Result<ManagerPreference, String> {
            let now = Utc::now();
            let preference = ManagerPreference {
                id: Uuid::new_v4(),
                tenant_id: command.tenant_id,
                user_id: command.user_id,
                pinned_app_keys: command.pinned_app_keys,
                theme: command.theme,
                created_at: now,
                updated_at: now,
            };
            self.preferences
                .lock()
                .map_err(|_| "lock poisoned".to_owned())?
                .push(preference.clone());
            Ok(preference)
        }

        async fn list_for_admin(
            &self,
            tenant_id: Uuid,
        ) -> Result<Vec<ManagerPreferenceSummary>, String> {
            Ok(self
                .preferences
                .lock()
                .map_err(|_| "lock poisoned".to_owned())?
                .iter()
                .filter(|item| item.tenant_id == tenant_id)
                .map(|item| ManagerPreferenceSummary {
                    user_id: item.user_id,
                    theme: item.theme.clone(),
                    pinned_count: item.pinned_app_keys.len(),
                })
                .collect())
        }
    }

    #[tokio::test]
    async fn manager_service_rejects_empty_theme() {
        let service = ManagerService::new(MemoryManagerRepository::new());
        let result = service
            .update_preferences(UpdateManagerPreferenceCommand {
                tenant_id: Uuid::new_v4(),
                user_id: Uuid::new_v4(),
                pinned_app_keys: vec![],
                theme: "   ".to_owned(),
            })
            .await;
        assert!(result.is_err());
    }
}
