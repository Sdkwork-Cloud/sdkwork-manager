//! API assembly for sdkwork-manager.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.

mod bootstrap;
mod generated;

pub use bootstrap::{assemble_api_router, ApiAssembly};

pub async fn assemble_business_routes(
    host: std::sync::Arc<sdkwork_manager_service_host::ManagerServiceHost>,
) -> ApiAssembly {
    let mut router = axum::Router::new();
    router = router.merge(sdkwork_routes_manager_app_api::gateway_mount(host.clone()).await);
    router = router.merge(sdkwork_routes_manager_backend_api::gateway_mount(host).await);
    ApiAssembly { router }
}

pub async fn assemble_api_router_from_env() -> Result<ApiAssembly, String> {
    let host = sdkwork_manager_service_host::ManagerServiceHost::from_env().await?;
    assemble_api_router(std::sync::Arc::new(host)).await
}

pub async fn assemble_business_routes_from_env() -> Result<ApiAssembly, String> {
    let host = sdkwork_manager_service_host::ManagerServiceHost::from_env().await?;
    Ok(assemble_business_routes(std::sync::Arc::new(host)).await)
}

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
