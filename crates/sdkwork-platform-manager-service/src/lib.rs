pub mod domain;
pub mod ports;
pub mod service;

pub use domain::{
    CommercialEntitlementDecision, CommercialEntitlementSnapshot, ManagerPreference,
    ManagerPreferenceSummary, UpdateCommercialEntitlementCommand, UpdateManagerPreferenceCommand,
};
pub use ports::{ManagerRepository, ManagerRepositoryError};
pub use service::{ManagerService, ManagerServiceError};
