use sdkwork_database_sqlx::DatabasePool;
use sdkwork_manager_database_host::{bootstrap_manager_database_from_env, ManagerDatabaseHost};
use sdkwork_platform_manager_repository_sqlx::SqlxManagerRepository;
use sdkwork_platform_manager_service::ManagerService;

pub struct ManagerServiceHost {
    database: ManagerDatabaseHost,
    manager_service: ManagerService<SqlxManagerRepository>,
}

impl ManagerServiceHost {
    pub async fn new() -> Self {
        Self::from_env()
            .await
            .expect("manager service host bootstrap failed")
    }

    pub async fn from_env() -> Result<Self, String> {
        let database = bootstrap_manager_database_from_env().await?;
        let repository = SqlxManagerRepository::new(database.pool().clone());
        Ok(Self {
            manager_service: ManagerService::new(repository),
            database,
        })
    }

    pub fn manager_service(&self) -> &ManagerService<SqlxManagerRepository> {
        &self.manager_service
    }

    pub fn database_pool(&self) -> &DatabasePool {
        self.database.pool()
    }

    pub fn database_module(&self) -> std::sync::Arc<sdkwork_database_spi::DefaultDatabaseModule> {
        self.database.module()
    }
}

pub fn default_seed_locale() -> &'static str {
    "zh-CN"
}

pub fn default_seed_profile() -> &'static str {
    "standard"
}
