use std::sync::Arc;

use crate::api::paths::backend_path;
use crate::http::{SdkworkError, SdkworkHttpClient};
use crate::models::{CommercialEntitlementDecisionRequest, CommercialEntitlementDecisionResponse, CommercialEntitlementResponse, ManagerPreferencesAdminListResponse, UpdateCommercialEntitlementRequest};

#[derive(Clone)]
pub struct ManagerApi {
    client: Arc<SdkworkHttpClient>,
}

impl ManagerApi {
    pub fn new(client: Arc<SdkworkHttpClient>) -> Self {
        Self { client }
    }

    /// List manager preferences for tenant administration
    pub async fn preferences_admin_list(&self) -> Result<ManagerPreferencesAdminListResponse, SdkworkError> {
        let path = backend_path(&"/manager/preferences".to_string());
        self.client.get(&path, None, None).await
    }

    /// Retrieve the current tenant application commercial entitlement snapshot
    pub async fn commercial_entitlements_current_retrieve(&self) -> Result<CommercialEntitlementResponse, SdkworkError> {
        let path = backend_path(&"/manager/commercial_entitlements/current".to_string());
        self.client.get(&path, None, None).await
    }

    /// Replace the current tenant application commercial entitlement snapshot
    pub async fn commercial_entitlements_current_update(&self, body: &UpdateCommercialEntitlementRequest) -> Result<CommercialEntitlementResponse, SdkworkError> {
        let path = backend_path(&"/manager/commercial_entitlements/current".to_string());
        self.client.put(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Evaluate one tenant application commercial entitlement
    pub async fn commercial_entitlements_verify(&self, body: &CommercialEntitlementDecisionRequest) -> Result<CommercialEntitlementDecisionResponse, SdkworkError> {
        let path = backend_path(&"/manager/commercial_entitlements/verify".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

}
