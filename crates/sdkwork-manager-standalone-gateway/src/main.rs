mod iam_application_bootstrap;

use sdkwork_manager_gateway_assembly::assemble_application_router;
use sdkwork_manager_service_host::ManagerServiceHost;
use sdkwork_web_bootstrap::{service_router, ServiceRouterConfig};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::info!("Starting SDKWork Manager API Server...");

    iam_application_bootstrap::ensure_manager_iam_application_bootstrap()
        .await
        .expect("bootstrap Manager IAM tenant application");
    tracing::info!("Manager IAM tenant application bootstrap completed");

    if std::env::var_os("SDKWORK_MANAGER_BOOTSTRAP_ONLY").is_some() {
        tracing::info!("SDKWORK_MANAGER_BOOTSTRAP_ONLY is set; exiting after IAM bootstrap");
        return;
    }

    let host = Arc::new(ManagerServiceHost::new().await);
    let assembly = assemble_application_router(host).await;
    let app = service_router(
        assembly.router,
        ServiceRouterConfig::default().with_always_ready(),
    );

    let addr = std::env::var("SDKWORK_MANAGER_APPLICATION_PUBLIC_INGRESS_BIND")
        .or_else(|_| std::env::var("MANAGER_API_BIND"))
        .unwrap_or_else(|_| "127.0.0.1:18092".to_owned());
    tracing::info!("Manager API server listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("bind manager server");
    axum::serve(listener, app)
        .await
        .expect("serve manager server");
}
