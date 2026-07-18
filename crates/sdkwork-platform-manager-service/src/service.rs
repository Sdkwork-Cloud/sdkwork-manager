use uuid::Uuid;

use crate::domain::{
    CommercialEntitlementDecision, CommercialEntitlementSnapshot, ManagerPreference,
    ManagerPreferenceSummary, UpdateCommercialEntitlementCommand, UpdateManagerPreferenceCommand,
};
use crate::ports::{ManagerRepository, ManagerRepositoryError};

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ManagerServiceError {
    #[error("invalid commercial entitlement: {0}")]
    InvalidInput(String),
    #[error("commercial entitlement version conflict")]
    VersionConflict,
    #[error("manager service unavailable: {0}")]
    Repository(String),
}

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

    pub async fn retrieve_commercial_entitlement(
        &self,
        tenant_id: Uuid,
        app_id: &str,
    ) -> Result<CommercialEntitlementSnapshot, ManagerServiceError> {
        validate_app_id(app_id)?;
        self.repository
            .find_commercial_entitlement(tenant_id, app_id)
            .await
            .map_err(map_repository_error)
            .map(|snapshot| snapshot.unwrap_or_else(|| foundation_snapshot(tenant_id, app_id)))
    }

    pub async fn update_commercial_entitlement(
        &self,
        mut command: UpdateCommercialEntitlementCommand,
    ) -> Result<CommercialEntitlementSnapshot, ManagerServiceError> {
        validate_app_id(&command.app_id)?;
        validate_tier(&command.tier)?;
        validate_status(&command.status)?;
        if command.expected_version < 0 {
            return Err(ManagerServiceError::InvalidInput(
                "expectedVersion must be zero or greater".to_owned(),
            ));
        }
        if command.updated_by.trim().is_empty() {
            return Err(ManagerServiceError::InvalidInput(
                "updatedBy is required".to_owned(),
            ));
        }
        if command.entitlement_keys.len() > 100 {
            return Err(ManagerServiceError::InvalidInput(
                "entitlementKeys cannot contain more than 100 entries".to_owned(),
            ));
        }
        for entitlement_key in &command.entitlement_keys {
            validate_entitlement_key(entitlement_key)?;
        }
        command.entitlement_keys.sort();
        command.entitlement_keys.dedup();
        self.repository
            .replace_commercial_entitlement(command)
            .await
            .map_err(map_repository_error)
    }

    pub async fn decide_commercial_entitlement(
        &self,
        tenant_id: Uuid,
        app_id: &str,
        entitlement_key: &str,
    ) -> Result<CommercialEntitlementDecision, ManagerServiceError> {
        validate_entitlement_key(entitlement_key)?;
        let snapshot = self
            .retrieve_commercial_entitlement(tenant_id, app_id)
            .await?;
        let now = chrono::Utc::now();
        let reason = if snapshot.status != "active" {
            "snapshot_inactive"
        } else if snapshot
            .valid_until
            .is_some_and(|valid_until| valid_until <= now)
        {
            "snapshot_expired"
        } else if !snapshot
            .entitlement_keys
            .iter()
            .any(|key| key == entitlement_key)
        {
            "entitlement_missing"
        } else {
            "entitlement_active"
        };
        Ok(CommercialEntitlementDecision {
            allowed: reason == "entitlement_active",
            app_id: snapshot.app_id,
            entitlement_key: entitlement_key.to_owned(),
            reason: reason.to_owned(),
            tier: snapshot.tier,
            snapshot_version: snapshot.version,
            valid_until: snapshot.valid_until,
        })
    }
}

fn validate_app_id(app_id: &str) -> Result<(), ManagerServiceError> {
    validate_code("appId", app_id, 128)
}

fn validate_entitlement_key(entitlement_key: &str) -> Result<(), ManagerServiceError> {
    validate_code("entitlementKey", entitlement_key, 160)
}

fn validate_code(field: &str, value: &str, max_len: usize) -> Result<(), ManagerServiceError> {
    let valid = !value.is_empty()
        && value.len() <= max_len
        && value.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '-' | '_')
        });
    if valid {
        Ok(())
    } else {
        Err(ManagerServiceError::InvalidInput(format!(
            "{field} must be an ASCII namespaced code"
        )))
    }
}

fn validate_tier(tier: &str) -> Result<(), ManagerServiceError> {
    if matches!(
        tier,
        "foundation" | "standard" | "professional" | "enterprise"
    ) {
        Ok(())
    } else {
        Err(ManagerServiceError::InvalidInput(
            "unsupported tier".to_owned(),
        ))
    }
}

fn validate_status(status: &str) -> Result<(), ManagerServiceError> {
    if matches!(status, "active" | "suspended" | "expired") {
        Ok(())
    } else {
        Err(ManagerServiceError::InvalidInput(
            "unsupported status".to_owned(),
        ))
    }
}

fn map_repository_error(error: ManagerRepositoryError) -> ManagerServiceError {
    match error {
        ManagerRepositoryError::VersionConflict => ManagerServiceError::VersionConflict,
        ManagerRepositoryError::Storage(message) => ManagerServiceError::Repository(message),
    }
}

fn foundation_snapshot(tenant_id: Uuid, app_id: &str) -> CommercialEntitlementSnapshot {
    CommercialEntitlementSnapshot {
        tenant_id,
        app_id: app_id.to_owned(),
        entitlement_keys: Vec::new(),
        tier: "foundation".to_owned(),
        status: "active".to_owned(),
        valid_until: None,
        version: 0,
        updated_at: chrono::Utc::now(),
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

        async fn find_commercial_entitlement(
            &self,
            _tenant_id: Uuid,
            _app_id: &str,
        ) -> Result<Option<CommercialEntitlementSnapshot>, ManagerRepositoryError> {
            Ok(None)
        }

        async fn replace_commercial_entitlement(
            &self,
            _command: UpdateCommercialEntitlementCommand,
        ) -> Result<CommercialEntitlementSnapshot, ManagerRepositoryError> {
            Err(ManagerRepositoryError::Storage(
                "not implemented in preference fake".to_owned(),
            ))
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

    #[tokio::test]
    async fn commercial_entitlements_fail_closed_without_snapshot() {
        let service = ManagerService::new(MemoryManagerRepository::new());
        let tenant_id = Uuid::new_v4();
        let snapshot = service
            .retrieve_commercial_entitlement(tenant_id, "sdkwork-manager-pc")
            .await
            .expect("foundation snapshot");
        assert_eq!(snapshot.version, 0);
        assert!(snapshot.entitlement_keys.is_empty());

        let decision = service
            .decide_commercial_entitlement(tenant_id, "sdkwork-manager-pc", "sdkwork.payment.admin")
            .await
            .expect("decision");
        assert!(!decision.allowed);
        assert_eq!(decision.reason, "entitlement_missing");
    }
}
