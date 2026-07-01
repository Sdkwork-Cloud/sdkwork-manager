use axum::routing::get;
use axum::Router;
use sdkwork_manager_service_host::ManagerServiceHost;
use std::sync::Arc;

use crate::handlers;
use crate::web_bootstrap::wrap_router_with_web_framework_from_env;

#[derive(Clone)]
pub struct ManagerAppState {
    pub host: Arc<ManagerServiceHost>,
}

pub fn build_manager_app_router(host: Arc<ManagerServiceHost>) -> Router {
    let state = ManagerAppState { host };
    Router::new()
        .route(
            "/app/v3/api/manager/preferences",
            get(handlers::retrieve_preferences).put(handlers::update_preferences),
        )
        .with_state(state)
}

pub async fn build_manager_app_router_with_framework(host: Arc<ManagerServiceHost>) -> Router {
    wrap_router_with_web_framework_from_env(build_manager_app_router(host)).await
}
