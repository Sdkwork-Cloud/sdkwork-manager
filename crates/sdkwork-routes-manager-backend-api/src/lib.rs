//! Backend API route boundary for SDKWork Manager.

use std::sync::Arc;

use axum::Router;
use sdkwork_manager_service_host::ManagerServiceHost;
use sdkwork_web_core::HttpRouteManifest;

pub mod handlers;
pub mod http_route_manifest;
pub mod routes;
pub mod web_bootstrap;

pub use http_route_manifest::backend_route_manifest;
pub use routes::{build_manager_backend_router, build_manager_backend_router_with_framework};
pub use web_bootstrap::{
    manager_backend_api_public_path_prefixes, wrap_router_with_web_framework,
    wrap_router_with_web_framework_from_env,
};

pub fn gateway_route_manifest() -> HttpRouteManifest {
    backend_route_manifest()
}

pub async fn gateway_mount(host: Arc<ManagerServiceHost>) -> Router {
    build_manager_backend_router_with_framework(host).await
}
