use async_trait::async_trait;
use chrono::Utc;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_platform_manager_service::domain::{
    CommercialEntitlementSnapshot, ManagerPreference, ManagerPreferenceSummary,
    UpdateCommercialEntitlementCommand, UpdateManagerPreferenceCommand,
};
use sdkwork_platform_manager_service::ports::{ManagerRepository, ManagerRepositoryError};
use sqlx::{PgPool, Row};
use uuid::Uuid;

pub struct SqlxManagerRepository {
    pool: PgPool,
}

impl SqlxManagerRepository {
    pub fn new(pool: DatabasePool) -> Self {
        Self {
            pool: pool
                .as_postgres()
                .cloned()
                .expect("manager repository requires postgres DatabasePool"),
        }
    }
}

#[async_trait]
impl ManagerRepository for SqlxManagerRepository {
    async fn find_by_tenant_and_user(
        &self,
        tenant_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<ManagerPreference>, String> {
        let row = sqlx::query(
            r#"
            SELECT id, tenant_id, user_id, pinned_app_keys, theme, created_at, updated_at
            FROM platform_manager_preference
            WHERE tenant_id = $1 AND user_id = $2
            LIMIT 1
            "#,
        )
        .bind(tenant_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| format!("query manager preference failed: {error}"))?;

        Ok(row.map(map_preference))
    }

    async fn upsert_preference(
        &self,
        command: UpdateManagerPreferenceCommand,
    ) -> Result<ManagerPreference, String> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let pinned_json = serde_json::to_value(&command.pinned_app_keys)
            .map_err(|error| format!("serialize pinned apps failed: {error}"))?;

        sqlx::query(
            r#"
            INSERT INTO platform_manager_preference (id, tenant_id, user_id, pinned_app_keys, theme, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (tenant_id, user_id) DO UPDATE
            SET pinned_app_keys = EXCLUDED.pinned_app_keys,
                theme = EXCLUDED.theme,
                updated_at = EXCLUDED.updated_at
            "#,
        )
        .bind(id)
        .bind(command.tenant_id)
        .bind(command.user_id)
        .bind(pinned_json)
        .bind(&command.theme)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|error| format!("upsert manager preference failed: {error}"))?;

        self.find_by_tenant_and_user(command.tenant_id, command.user_id)
            .await?
            .ok_or_else(|| "manager preference missing after upsert".to_owned())
    }

    async fn list_for_admin(
        &self,
        tenant_id: Uuid,
    ) -> Result<Vec<ManagerPreferenceSummary>, String> {
        let rows = sqlx::query(
            r#"
            SELECT user_id, theme, pinned_app_keys
            FROM platform_manager_preference
            WHERE tenant_id = $1
            ORDER BY updated_at DESC
            "#,
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|error| format!("list manager preferences failed: {error}"))?;

        Ok(rows
            .into_iter()
            .map(|row| {
                let pinned: serde_json::Value = row.get("pinned_app_keys");
                let pinned_count = pinned.as_array().map(|items| items.len()).unwrap_or(0);
                ManagerPreferenceSummary {
                    user_id: row.get("user_id"),
                    theme: row.get("theme"),
                    pinned_count,
                }
            })
            .collect())
    }

    async fn find_commercial_entitlement(
        &self,
        tenant_id: Uuid,
        app_id: &str,
    ) -> Result<Option<CommercialEntitlementSnapshot>, ManagerRepositoryError> {
        let row = sqlx::query(
            r#"
            SELECT tenant_id, app_id, tier, status, valid_until, version, updated_at
            FROM platform_manager_entitlement_snapshot
            WHERE tenant_id = $1 AND app_id = $2
            LIMIT 1
            "#,
        )
        .bind(tenant_id)
        .bind(app_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(storage_error("query commercial entitlement snapshot"))?;

        let Some(row) = row else {
            return Ok(None);
        };
        let grants = sqlx::query(
            r#"
            SELECT entitlement_key
            FROM platform_manager_entitlement_grant
            WHERE tenant_id = $1 AND app_id = $2 AND revoked_at IS NULL
            ORDER BY entitlement_key ASC
            "#,
        )
        .bind(tenant_id)
        .bind(app_id)
        .fetch_all(&self.pool)
        .await
        .map_err(storage_error("query commercial entitlement grants"))?;

        Ok(Some(CommercialEntitlementSnapshot {
            tenant_id: row.get("tenant_id"),
            app_id: row.get("app_id"),
            entitlement_keys: grants
                .into_iter()
                .map(|grant| grant.get("entitlement_key"))
                .collect(),
            tier: row.get("tier"),
            status: row.get("status"),
            valid_until: row.get("valid_until"),
            version: row.get("version"),
            updated_at: row.get("updated_at"),
        }))
    }

    async fn replace_commercial_entitlement(
        &self,
        command: UpdateCommercialEntitlementCommand,
    ) -> Result<CommercialEntitlementSnapshot, ManagerRepositoryError> {
        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(storage_error("begin commercial entitlement transaction"))?;
        let existing_version = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT version
            FROM platform_manager_entitlement_snapshot
            WHERE tenant_id = $1 AND app_id = $2
            FOR UPDATE
            "#,
        )
        .bind(command.tenant_id)
        .bind(&command.app_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(storage_error("lock commercial entitlement snapshot"))?;

        if existing_version.unwrap_or(0) != command.expected_version {
            return Err(ManagerRepositoryError::VersionConflict);
        }

        let now = Utc::now();
        let next_version = command.expected_version + 1;
        if existing_version.is_some() {
            sqlx::query(
                r#"
                UPDATE platform_manager_entitlement_snapshot
                SET tier = $3,
                    status = $4,
                    valid_until = $5,
                    version = $6,
                    updated_by = $7,
                    updated_at = $8
                WHERE tenant_id = $1 AND app_id = $2 AND version = $9
                "#,
            )
            .bind(command.tenant_id)
            .bind(&command.app_id)
            .bind(&command.tier)
            .bind(&command.status)
            .bind(command.valid_until)
            .bind(next_version)
            .bind(&command.updated_by)
            .bind(now)
            .bind(command.expected_version)
            .execute(&mut *transaction)
            .await
            .map_err(storage_error("update commercial entitlement snapshot"))?;
        } else {
            sqlx::query(
                r#"
                INSERT INTO platform_manager_entitlement_snapshot (
                    id, tenant_id, app_id, tier, status, valid_until, version,
                    updated_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(command.tenant_id)
            .bind(&command.app_id)
            .bind(&command.tier)
            .bind(&command.status)
            .bind(command.valid_until)
            .bind(next_version)
            .bind(&command.updated_by)
            .bind(now)
            .execute(&mut *transaction)
            .await
            .map_err(storage_error("create commercial entitlement snapshot"))?;
        }

        sqlx::query(
            r#"
            UPDATE platform_manager_entitlement_grant
            SET revoked_at = $3, updated_by = $4
            WHERE tenant_id = $1 AND app_id = $2 AND revoked_at IS NULL
            "#,
        )
        .bind(command.tenant_id)
        .bind(&command.app_id)
        .bind(now)
        .bind(&command.updated_by)
        .execute(&mut *transaction)
        .await
        .map_err(storage_error("revoke commercial entitlement grants"))?;

        for entitlement_key in &command.entitlement_keys {
            sqlx::query(
                r#"
                INSERT INTO platform_manager_entitlement_grant (
                    id, tenant_id, app_id, entitlement_key, granted_at, revoked_at, updated_by
                ) VALUES ($1, $2, $3, $4, $5, NULL, $6)
                ON CONFLICT (tenant_id, app_id, entitlement_key) DO UPDATE
                SET granted_at = EXCLUDED.granted_at,
                    revoked_at = NULL,
                    updated_by = EXCLUDED.updated_by
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(command.tenant_id)
            .bind(&command.app_id)
            .bind(entitlement_key)
            .bind(now)
            .bind(&command.updated_by)
            .execute(&mut *transaction)
            .await
            .map_err(storage_error("upsert commercial entitlement grant"))?;
        }

        transaction
            .commit()
            .await
            .map_err(storage_error("commit commercial entitlement transaction"))?;
        self.find_commercial_entitlement(command.tenant_id, &command.app_id)
            .await?
            .ok_or_else(|| {
                ManagerRepositoryError::Storage(
                    "commercial entitlement missing after transaction".to_owned(),
                )
            })
    }
}

fn storage_error(operation: &'static str) -> impl FnOnce(sqlx::Error) -> ManagerRepositoryError {
    move |error| ManagerRepositoryError::Storage(format!("{operation} failed: {error}"))
}

fn map_preference(row: sqlx::postgres::PgRow) -> ManagerPreference {
    let pinned: serde_json::Value = row.get("pinned_app_keys");
    let pinned_app_keys = pinned
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|value| value.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default();

    ManagerPreference {
        id: row.get("id"),
        tenant_id: row.get("tenant_id"),
        user_id: row.get("user_id"),
        pinned_app_keys,
        theme: row.get("theme"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repository_type_name_is_stable() {
        let _ = std::any::type_name::<SqlxManagerRepository>();
    }
}
