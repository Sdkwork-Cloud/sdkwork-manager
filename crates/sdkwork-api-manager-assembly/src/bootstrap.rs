//! Authored API assembly bootstrap for sdkwork-manager.
//!
//! The assembly exports the indivisible `ApiAssemblyContribution` contract
//! (API_ASSEMBLY_SPEC.md section 4); the platform cloud gateway composes the
//! contribution with its process-shared PostgreSQL pool.

use axum::Router;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_manager_service_host::ManagerServiceHost;
use sdkwork_web_bootstrap::{
    ApiAssemblyContribution, DatabasePoolReadinessCheck, ReadinessCheck,
};
use sdkwork_web_core::HttpRouteManifest;
use std::sync::Arc;

/// Indivisible host-neutral API assembly contribution (web-bootstrap contract).
pub type ApiAssembly = ApiAssemblyContribution;

fn combined_route_manifest() -> HttpRouteManifest {
    let manifests = [
        sdkwork_routes_manager_app_api::gateway_route_manifest(),
        sdkwork_routes_manager_backend_api::gateway_route_manifest(),
    ];
    HttpRouteManifest::from_owned_routes(
        manifests
            .into_iter()
            .flat_map(|manifest| manifest.routes().to_vec())
            .collect(),
    )
}

pub async fn assemble_api_router(host: Arc<ManagerServiceHost>) -> Result<ApiAssembly, String> {
    let mut router = Router::new();
    let (iam, iam_host) = sdkwork_api_iam_assembly::bootstrap_iam_for_application()
        .await
        .map_err(|error| format!("assemble sdkwork-iam routes failed: {error}"))?;
    let iam_resolver = sdkwork_iam_web_adapter::IamWebRequestContextResolver::from_database_pool(
        Some(iam_host.pool().clone()),
    );
    router = router.merge(
        sdkwork_iam_web_adapter::wrap_router_with_iam_owner_web_framework(
            iam.router,
            iam_resolver,
            iam.route_manifest,
        ),
    );

    let drive = sdkwork_api_drive_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-drive routes failed: {error}"))?;
    router = router.merge(drive.router);

    let order = sdkwork_api_order_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-order routes failed: {error}"))?;
    router = router.merge(order.router);

    let promotion = sdkwork_api_promotion_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-promotion routes failed: {error}"))?;
    router = router.merge(promotion.router);

    let payment = sdkwork_api_payment_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-payment routes failed: {error}"))?;
    router = router.merge(payment.router);

    let membership = sdkwork_api_membership_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-membership routes failed: {error}"))?;
    router = router.merge(membership.router);

    router = router.merge(sdkwork_routes_manager_app_api::gateway_mount(host.clone()).await);
    router = router.merge(sdkwork_routes_manager_backend_api::gateway_mount(host).await);
    ApiAssemblyContribution::from_manifest(
        "sdkwork-manager",
        "SDKWork Manager API",
        router,
        combined_route_manifest(),
        Vec::new(),
        Arc::new(sdkwork_web_bootstrap::AlwaysReady),
    )
}

/// Assemble the manager application router from environment variables.
pub async fn assemble_business_routes_from_env() -> Result<ApiAssembly, String> {
    let host = Arc::new(ManagerServiceHost::from_env().await?);
    assemble_api_router(host).await
}

/// Assemble the Manager contribution against a caller-provided database pool so
/// the platform cloud gateway can share its process-wide PostgreSQL pool.
///
/// Only manager-owned routes are mounted; the cloud gateway hosts the
/// dependency-owned IAM, Drive, Order, Promotion, Payment, and Membership
/// surfaces as separate contributions.
pub async fn assemble_api_router_with_pool(pool: DatabasePool) -> Result<ApiAssembly, String> {
    let host = Arc::new(ManagerServiceHost::from_database_pool(pool.clone()).await?);
    let mut router = Router::new();
    router = router.merge(sdkwork_routes_manager_app_api::gateway_mount(host.clone()).await);
    router = router.merge(sdkwork_routes_manager_backend_api::gateway_mount(host).await);
    ApiAssemblyContribution::from_manifest(
        "sdkwork-manager",
        "SDKWork Manager API",
        router,
        combined_route_manifest(),
        Vec::new(),
        Arc::new(DatabasePoolReadinessCheck::new(pool)),
    )
}
