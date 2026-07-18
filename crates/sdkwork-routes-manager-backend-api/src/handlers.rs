use axum::extract::State;
use axum::response::Response;
use axum::Json;
use chrono::{DateTime, Utc};
use sdkwork_platform_manager_service::{
    CommercialEntitlementDecision, CommercialEntitlementSnapshot, ManagerPreferenceSummary,
    ManagerServiceError, UpdateCommercialEntitlementCommand,
};
use sdkwork_routes_manager_common::{
    admin_preference_page, commercial_entitlement_resource, envelope::AdminPreferenceItem,
    finish_api_json, ApiProblem, CommercialEntitlementDecisionItem, CommercialEntitlementItem,
    SdkWorkPageData, SdkWorkResourceData,
};
use sdkwork_web_core::WebRequestContext;
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::ManagerBackendState;

pub async fn list_preferences_admin(
    ctx: WebRequestContext,
    State(state): State<ManagerBackendState>,
) -> Response {
    finish_api_json(&ctx, list_preferences_admin_inner(&ctx, state).await)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UpdateCommercialEntitlementRequest {
    pub app_id: String,
    pub entitlement_keys: Vec<String>,
    pub tier: String,
    pub status: String,
    pub valid_until: Option<DateTime<Utc>>,
    pub expected_version: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DecideCommercialEntitlementRequest {
    pub app_id: String,
    pub entitlement_key: String,
}

pub async fn retrieve_commercial_entitlement(
    ctx: WebRequestContext,
    State(state): State<ManagerBackendState>,
) -> Response {
    finish_api_json(
        &ctx,
        retrieve_commercial_entitlement_inner(&ctx, state).await,
    )
}

pub async fn update_commercial_entitlement(
    ctx: WebRequestContext,
    State(state): State<ManagerBackendState>,
    Json(request): Json<UpdateCommercialEntitlementRequest>,
) -> Response {
    finish_api_json(
        &ctx,
        update_commercial_entitlement_inner(&ctx, state, request).await,
    )
}

pub async fn decide_commercial_entitlement(
    ctx: WebRequestContext,
    State(state): State<ManagerBackendState>,
    Json(request): Json<DecideCommercialEntitlementRequest>,
) -> Response {
    finish_api_json(
        &ctx,
        decide_commercial_entitlement_inner(&ctx, state, request).await,
    )
}

async fn retrieve_commercial_entitlement_inner(
    ctx: &WebRequestContext,
    state: ManagerBackendState,
) -> Result<SdkWorkResourceData<CommercialEntitlementItem>, ApiProblem> {
    let tenant_id = parse_uuid(ctx.tenant_id(), "tenant_id")?;
    let app_id = required_context_value(ctx.app_id(), "app_id")?;
    let snapshot = state
        .host
        .manager_service()
        .retrieve_commercial_entitlement(tenant_id, app_id)
        .await
        .map_err(map_service_error)?;
    Ok(commercial_entitlement_resource(map_snapshot(snapshot)))
}

async fn update_commercial_entitlement_inner(
    ctx: &WebRequestContext,
    state: ManagerBackendState,
    request: UpdateCommercialEntitlementRequest,
) -> Result<SdkWorkResourceData<CommercialEntitlementItem>, ApiProblem> {
    let tenant_id = parse_uuid(ctx.tenant_id(), "tenant_id")?;
    let updated_by = required_context_value(ctx.user_id(), "user_id")?.to_owned();
    let expected_version = request
        .expected_version
        .parse::<i64>()
        .map_err(|_| ApiProblem::bad_request("expectedVersion must be an int64 string"))?;
    let snapshot = state
        .host
        .manager_service()
        .update_commercial_entitlement(UpdateCommercialEntitlementCommand {
            tenant_id,
            app_id: request.app_id,
            entitlement_keys: request.entitlement_keys,
            tier: request.tier,
            status: request.status,
            valid_until: request.valid_until,
            expected_version,
            updated_by,
        })
        .await
        .map_err(map_service_error)?;
    Ok(commercial_entitlement_resource(map_snapshot(snapshot)))
}

async fn decide_commercial_entitlement_inner(
    ctx: &WebRequestContext,
    state: ManagerBackendState,
    request: DecideCommercialEntitlementRequest,
) -> Result<CommercialEntitlementDecisionItem, ApiProblem> {
    let tenant_id = parse_uuid(ctx.tenant_id(), "tenant_id")?;
    let decision = state
        .host
        .manager_service()
        .decide_commercial_entitlement(tenant_id, &request.app_id, &request.entitlement_key)
        .await
        .map_err(map_service_error)?;
    Ok(map_decision(decision))
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

fn required_context_value<'a>(value: Option<&'a str>, field: &str) -> Result<&'a str, ApiProblem> {
    value
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| ApiProblem::unauthorized(format!("missing {field}")))
}

fn map_snapshot(snapshot: CommercialEntitlementSnapshot) -> CommercialEntitlementItem {
    CommercialEntitlementItem {
        app_id: snapshot.app_id,
        entitlement_keys: snapshot.entitlement_keys,
        tier: snapshot.tier,
        status: snapshot.status,
        valid_until: snapshot.valid_until,
        version: snapshot.version.to_string(),
        updated_at: snapshot.updated_at,
    }
}

fn map_decision(decision: CommercialEntitlementDecision) -> CommercialEntitlementDecisionItem {
    CommercialEntitlementDecisionItem {
        accepted: true,
        allowed: decision.allowed,
        app_id: decision.app_id,
        entitlement_key: decision.entitlement_key,
        reason: decision.reason,
        status: if decision.allowed {
            "allowed"
        } else {
            "denied"
        }
        .to_owned(),
        tier: decision.tier,
        snapshot_version: decision.snapshot_version.to_string(),
        valid_until: decision.valid_until,
    }
}

fn map_service_error(error: ManagerServiceError) -> ApiProblem {
    match error {
        ManagerServiceError::InvalidInput(message) => ApiProblem::bad_request(message),
        ManagerServiceError::VersionConflict => {
            ApiProblem::conflict("commercial entitlement version conflict")
        }
        ManagerServiceError::Repository(message) => ApiProblem::internal_server_error(message),
    }
}
