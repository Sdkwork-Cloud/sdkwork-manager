use axum::extract::State;
use axum::response::Response;
use sdkwork_routes_manager_common::{
    envelope::{preference_resource, ManagerPreferenceItem},
    finish_api_json, parse_context_uuid, ApiProblem, SdkWorkResourceData,
};
use sdkwork_web_core::WebRequestContext;
use serde::Deserialize;

use crate::routes::ManagerAppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UpdatePreferencesBody {
    pub pinned_app_keys: Vec<String>,
    pub theme: String,
}

pub async fn retrieve_preferences(
    ctx: WebRequestContext,
    State(state): State<ManagerAppState>,
) -> Response {
    finish_api_json(&ctx, retrieve_preferences_inner(&ctx, state).await)
}

pub async fn update_preferences(
    ctx: WebRequestContext,
    State(state): State<ManagerAppState>,
    axum::Json(body): axum::Json<UpdatePreferencesBody>,
) -> Response {
    finish_api_json(&ctx, update_preferences_inner(&ctx, state, body).await)
}

async fn retrieve_preferences_inner(
    ctx: &WebRequestContext,
    state: ManagerAppState,
) -> Result<SdkWorkResourceData<ManagerPreferenceItem>, ApiProblem> {
    let tenant_id = parse_context_uuid(ctx.tenant_id(), "tenant_id")?;
    let user_id = parse_context_uuid(ctx.user_id(), "user_id")?;

    let preference = state
        .host
        .manager_service()
        .retrieve_preferences(tenant_id, user_id)
        .await
        .map_err(ApiProblem::internal_server_error)?;

    Ok(preference_resource(ManagerPreferenceItem {
        pinned_app_keys: preference.pinned_app_keys,
        theme: preference.theme,
    }))
}

async fn update_preferences_inner(
    ctx: &WebRequestContext,
    state: ManagerAppState,
    body: UpdatePreferencesBody,
) -> Result<SdkWorkResourceData<ManagerPreferenceItem>, ApiProblem> {
    let tenant_id = parse_context_uuid(ctx.tenant_id(), "tenant_id")?;
    let user_id = parse_context_uuid(ctx.user_id(), "user_id")?;

    let preference = state
        .host
        .manager_service()
        .update_preferences(
            sdkwork_platform_manager_service::UpdateManagerPreferenceCommand {
                tenant_id,
                user_id,
                pinned_app_keys: body.pinned_app_keys,
                theme: body.theme,
            },
        )
        .await
        .map_err(ApiProblem::bad_request)?;

    Ok(preference_resource(ManagerPreferenceItem {
        pinned_app_keys: preference.pinned_app_keys,
        theme: preference.theme,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn update_body_deserializes_camel_case() {
        let body: UpdatePreferencesBody =
            serde_json::from_str(r#"{"pinnedAppKeys":["drive"],"theme":"dark"}"#).expect("json");
        assert_eq!(body.theme, "dark");
        assert_eq!(body.pinned_app_keys, vec!["drive".to_owned()]);
    }

    #[test]
    fn update_body_rejects_unknown_fields() {
        let result: Result<UpdatePreferencesBody, _> =
            serde_json::from_str(r#"{"pinnedAppKeys":["drive"],"theme":"dark","extra":1}"#);
        assert!(result.is_err());
    }
}
