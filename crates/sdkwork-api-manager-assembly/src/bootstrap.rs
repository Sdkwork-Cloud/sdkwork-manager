//! Authored API assembly bootstrap for sdkwork-manager.

use axum::Router;
use sdkwork_manager_service_host::ManagerServiceHost;
use std::sync::Arc;

pub struct ApiAssembly {
    pub router: Router,
}

pub async fn assemble_api_router(
    host: Arc<ManagerServiceHost>,
) -> Result<ApiAssembly, String> {
    let mut router = Router::new();
    let iam = sdkwork_iam_gateway_assembly::assemble_application_business_router().await;
    router = router.merge(iam.router);

    let drive = sdkwork_drive_gateway_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-drive routes failed: {error}"))?;
    router = router.merge(drive.router);

    let order = sdkwork_order_gateway_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-order routes failed: {error}"))?;
    router = router.merge(order.router);

    let promotion = sdkwork_promotion_gateway_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-promotion routes failed: {error}"))?;
    router = router.merge(promotion.router);

    let payment = sdkwork_payment_gateway_assembly::assemble_backend_business_router_from_env()
        .await
        .map_err(|error| format!("assemble sdkwork-payment routes failed: {error}"))?;
    router = router.merge(payment.router);

    let membership =
        sdkwork_membership_gateway_assembly::assemble_backend_business_router_from_env()
            .await
            .map_err(|error| format!("assemble sdkwork-membership routes failed: {error}"))?;
    router = router.merge(membership.router);

    router = router.merge(sdkwork_routes_manager_app_api::gateway_mount(host.clone()).await);
    router = router.merge(sdkwork_routes_manager_backend_api::gateway_mount(host).await);
    Ok(ApiAssembly { router })
}
