use axum::body::to_bytes;
use sdkwork_routes_manager_common::{
    envelope::{preference_resource, ManagerPreferenceItem},
    finish_api_json, ok_json,
};
use sdkwork_web_core::{
    ServerRequestId, WebApiSurface, WebAuthMode, WebRequestContext, WebTransportFacts,
};

fn test_context() -> WebRequestContext {
    WebRequestContext {
        request_id: ServerRequestId("manager-test-req".to_owned()),
        api_surface: WebApiSurface::AppApi,
        auth_mode: WebAuthMode::DualToken,
        principal: None,
        transport: WebTransportFacts {
            path: "/app/v3/api/manager/preferences".to_owned(),
            method: "GET".to_owned(),
            auth_token_present: true,
            access_token_present: true,
            api_key_present: false,
            oauth_bearer_present: false,
            agent_token_present: false,
        },
        locale: None,
        client_kind: None,
        operation: None,
        trace_id: Some("trace-manager-test".to_owned()),
    }
}

#[tokio::test]
async fn finish_api_json_emits_sdkwork_api_response() {
    let ctx = test_context();
    let response = finish_api_json(
        &ctx,
        ok_json(preference_resource(ManagerPreferenceItem {
            pinned_app_keys: vec!["drive".to_owned()],
            theme: "system".to_owned(),
        })),
    );
    let body = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("body");
    let payload: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(0, payload["code"].as_i64().unwrap());
    assert_eq!("trace-manager-test", payload["traceId"].as_str().unwrap());
    assert_eq!("system", payload["data"]["item"]["theme"].as_str().unwrap());
}
