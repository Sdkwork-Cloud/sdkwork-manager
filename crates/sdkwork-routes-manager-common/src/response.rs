use axum::{
    http::{HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use sdkwork_utils_rust::SdkWorkApiResponse;
use sdkwork_web_core::{
    problem_response, WebFrameworkError, WebFrameworkErrorKind, WebRequestContext,
};
use serde::Serialize;
use uuid::Uuid;

pub type ApiResult<T> = Result<T, ApiProblem>;

pub fn ok_json<T>(data: T) -> ApiResult<T> {
    Ok(data)
}

pub fn success_json<T: Serialize>(
    ctx: &WebRequestContext,
    data: T,
) -> Result<Response, ApiProblem> {
    success_response(ctx, StatusCode::OK, data)
}

fn success_response<T: Serialize>(
    ctx: &WebRequestContext,
    status: StatusCode,
    data: T,
) -> Result<Response, ApiProblem> {
    let trace_id = ctx.resolved_trace_id();
    let envelope = SdkWorkApiResponse::success(data, trace_id.clone());
    let mut response = (status, Json(envelope)).into_response();
    attach_trace_header(&mut response, &trace_id);
    Ok(response)
}

fn attach_trace_header(response: &mut Response, trace_id: &str) {
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(HeaderName::from_static("x-sdkwork-trace-id"), value);
    }
}

#[derive(Debug)]
pub struct ApiProblem {
    pub message: String,
    status: StatusCode,
}

impl ApiProblem {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            status: StatusCode::BAD_REQUEST,
        }
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            status: StatusCode::UNAUTHORIZED,
        }
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            status: StatusCode::CONFLICT,
        }
    }

    pub fn internal_server_error(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            status: StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn framework_error(&self) -> WebFrameworkError {
        let kind = match self.status {
            StatusCode::BAD_REQUEST => WebFrameworkErrorKind::BadRequest,
            StatusCode::UNAUTHORIZED => WebFrameworkErrorKind::MissingCredentials,
            StatusCode::CONFLICT => WebFrameworkErrorKind::Conflict,
            StatusCode::INTERNAL_SERVER_ERROR => WebFrameworkErrorKind::InternalServerError,
            _ => WebFrameworkErrorKind::InternalServerError,
        };
        WebFrameworkError {
            kind,
            message: self.message.clone(),
            retry_after_seconds: None,
        }
    }

    pub fn into_response_for(&self, ctx: &WebRequestContext) -> Response {
        problem_response(&self.framework_error(), ctx.problem_correlation())
    }
}

pub fn finish_api_json<T: Serialize>(ctx: &WebRequestContext, result: ApiResult<T>) -> Response {
    match result {
        Ok(data) => {
            success_json(ctx, data).unwrap_or_else(|problem| problem.into_response_for(ctx))
        }
        Err(problem) => problem.into_response_for(ctx),
    }
}

pub fn service_result<T, E: Into<ApiProblem>>(result: Result<T, E>) -> ApiResult<T> {
    result.map_err(Into::into)
}

/// 从请求上下文中解析必填的 UUID，缺失返回 401，格式错误返回 400。
pub fn parse_context_uuid(value: Option<&str>, field: &str) -> Result<Uuid, ApiProblem> {
    let raw = value.ok_or_else(|| ApiProblem::unauthorized(format!("missing {field}")))?;
    Uuid::parse_str(raw).map_err(|_| ApiProblem::bad_request(format!("invalid {field}")))
}

/// 从请求上下文中提取必填的非空字符串，缺失或空白返回 401。
pub fn required_context_value<'a>(value: Option<&'a str>, field: &str) -> Result<&'a str, ApiProblem> {
    value
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| ApiProblem::unauthorized(format!("missing {field}")))
}
