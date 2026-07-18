use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest};

const HTTP_ROUTES: &[HttpRoute] = &[
    HttpRoute::dual_token(
        HttpMethod::Get,
        "/backend/v3/api/manager/preferences",
        "manager",
        "manager.preferences.admin.list",
    ),
    HttpRoute::dual_token(
        HttpMethod::Get,
        "/backend/v3/api/manager/commercial_entitlements/current",
        "manager",
        "manager.commercialEntitlements.current.retrieve",
    )
    .with_required_permission("manager.entitlements.read"),
    HttpRoute::dual_token(
        HttpMethod::Put,
        "/backend/v3/api/manager/commercial_entitlements/current",
        "manager",
        "manager.commercialEntitlements.current.update",
    )
    .with_required_permission("manager.entitlements.manage"),
    HttpRoute::dual_token(
        HttpMethod::Post,
        "/backend/v3/api/manager/commercial_entitlements/verify",
        "manager",
        "manager.commercialEntitlements.verify",
    )
    .with_required_permission("manager.entitlements.enforce"),
];

pub fn backend_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(HTTP_ROUTES)
}
