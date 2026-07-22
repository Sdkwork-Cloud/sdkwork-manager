//! Authored API assembly bootstrap for sdkwork-manager.

use axum::Router;
use sdkwork_manager_service_host::ManagerServiceHost;
use std::sync::Arc;

pub struct ApiAssembly {
    pub router: Router,
}

pub async fn assemble_api_router(host: Arc<ManagerServiceHost>) -> Result<ApiAssembly, String> {
    let mut router = Router::new();
    let iam = sdkwork_api_iam_assembly::assemble_api_router().await;
    router = router.merge(iam.router);

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
    Ok(ApiAssembly { router })
}
