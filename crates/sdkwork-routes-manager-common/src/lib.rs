//! Shared HTTP response mapping for SDKWork Manager route crates.

pub mod envelope;
pub mod response;

pub use envelope::{
    admin_preference_page, preference_resource, AdminPreferenceItem, ManagerPreferenceItem,
};
pub use response::{finish_api_json, ok_json, service_result, ApiProblem, ApiResult};
pub use sdkwork_utils_rust::{SdkWorkPageData, SdkWorkResourceData};
