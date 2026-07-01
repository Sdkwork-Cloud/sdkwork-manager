use axum::extract::State;
use axum::response::Response;
use sdkwork_platform_manager_service::ManagerPreferenceSummary;
use sdkwork_routes_manager_common::{
    admin_preference_page, envelope::AdminPreferenceItem, finish_api_json, ApiProblem,
    SdkWorkPageData,
};
use sdkwork_web_core::WebRequestContext;
use uuid::Uuid;

use crate::routes::ManagerBackendState;

pub async fn list_preferences_admin(
    ctx: WebRequestContext,
    State(state): State<ManagerBackendState>,
) -> Response {
    finish_api_json(&ctx, list_preferences_admin_inner(&ctx, state).await)
}

async fn list_preferences_admin_inner(
    ctx: &WebRequestContext,
    state: ManagerBackendState,
) -> Result<SdkWorkPageData<AdminPreferenceItem>, ApiProblem> {
    let tenant_id = parse_uuid(ctx.tenant_id(), "tenant_id")?;
    let items = state
        .host
        .manager_service()
        .list_preferences_for_admin(tenant_id)
        .await
        .map_err(ApiProblem::internal_server_error)?;

    Ok(admin_preference_page(map_admin_items(items)))
}

fn map_admin_items(items: Vec<ManagerPreferenceSummary>) -> Vec<AdminPreferenceItem> {
    items
        .into_iter()
        .map(|item| AdminPreferenceItem {
            user_id: item.user_id,
            theme: item.theme,
            pinned_count: item.pinned_count,
        })
        .collect()
}

fn parse_uuid(value: Option<&str>, field: &str) -> Result<Uuid, ApiProblem> {
    let raw = value.ok_or_else(|| ApiProblem::unauthorized(format!("missing {field}")))?;
    Uuid::parse_str(raw).map_err(|_| ApiProblem::bad_request(format!("invalid {field}")))
}
