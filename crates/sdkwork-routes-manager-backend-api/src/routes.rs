use axum::routing::get;
use axum::Router;
use sdkwork_manager_service_host::ManagerServiceHost;
use std::sync::Arc;

use crate::handlers;
use crate::web_bootstrap::wrap_router_with_web_framework_from_env;

#[derive(Clone)]
pub struct ManagerBackendState {
    pub host: Arc<ManagerServiceHost>,
}

pub fn build_manager_backend_router(host: Arc<ManagerServiceHost>) -> Router {
    let state = ManagerBackendState { host };
    Router::new()
        .route(
            "/backend/v3/api/manager/preferences",
            get(handlers::list_preferences_admin),
        )
        .with_state(state)
}

pub async fn build_manager_backend_router_with_framework(host: Arc<ManagerServiceHost>) -> Router {
    wrap_router_with_web_framework_from_env(build_manager_backend_router(host)).await
}
