use sdkwork_manager_gateway_assembly::assemble_application_router;
use sdkwork_manager_service_host::ManagerServiceHost;
use sdkwork_web_bootstrap::{service_router, ServiceRouterConfig};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::info!("Starting SDKWork Manager API Server...");

    let host = Arc::new(ManagerServiceHost::new().await);
    let assembly = assemble_application_router(host).await;

    let business = assembly.router.layer(
        sdkwork_web_bootstrap::application_cors_layer_from_env(
            &["SDKWORK_MANAGER_ENVIRONMENT"],
            &["SDKWORK_MANAGER_CORS_ALLOWED_ORIGINS", "SDKWORK_CORS_ALLOWED_ORIGINS"],
        ),
    );
    let app = service_router(business, ServiceRouterConfig::default().with_always_ready());

    let addr = std::env::var("MANAGER_API_BIND").unwrap_or_else(|_| "0.0.0.0:18092".to_owned());
    tracing::info!("Manager API server listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("bind manager server");
    axum::serve(listener, app)
        .await
        .expect("serve manager server");
}
