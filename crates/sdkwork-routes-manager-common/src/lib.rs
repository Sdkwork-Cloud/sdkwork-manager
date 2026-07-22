//! Shared HTTP response mapping for SDKWork Manager route crates.

pub mod envelope;
pub mod response;

pub use envelope::{
    admin_preference_page, commercial_entitlement_resource, preference_resource,
    AdminPreferenceItem, CommercialEntitlementDecisionItem, CommercialEntitlementItem,
    ManagerPreferenceItem,
};
pub use response::{
    finish_api_json, ok_json, parse_context_uuid, required_context_value, service_result,
    ApiProblem, ApiResult,
};
pub use sdkwork_utils_rust::{SdkWorkPageData, SdkWorkResourceData};
