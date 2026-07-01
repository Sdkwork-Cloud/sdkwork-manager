use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest};

const HTTP_ROUTES: &[HttpRoute] = &[
    HttpRoute::dual_token(
        HttpMethod::Get,
        "/app/v3/api/manager/preferences",
        "manager",
        "manager.preferences.retrieve",
    ),
    HttpRoute::dual_token(
        HttpMethod::Put,
        "/app/v3/api/manager/preferences",
        "manager",
        "manager.preferences.update",
    ),
];

pub fn app_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(HTTP_ROUTES)
}
