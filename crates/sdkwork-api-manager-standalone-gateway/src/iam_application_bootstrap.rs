use std::path::PathBuf;

use sdkwork_iam_embedded_application_bootstrap::{
    ensure_tenant_application_from_app_root, EmbeddedApplicationBootstrapOptions,
};

pub async fn ensure_manager_iam_application_bootstrap() -> Result<(), String> {
    let app_root = resolve_manager_app_root();
    sdkwork_iam_database_host::unified_postgres_env::apply_unified_claw_postgres_env(&app_root);
    sdkwork_iam_database_host::bootstrap_iam_database_from_env()
        .await
        .map_err(|error| format!("failed to bootstrap IAM database lifecycle: {error}"))?;

    ensure_tenant_application_from_app_root(
        app_root.as_path(),
        &EmbeddedApplicationBootstrapOptions {
            environment: resolve_manager_environment(),
            ..EmbeddedApplicationBootstrapOptions::default()
        },
        None,
        &[],
    )
    .await
}

fn resolve_manager_app_root() -> PathBuf {
    std::env::var("SDKWORK_MANAGER_APP_ROOT")
        .or_else(|_| std::env::var("SDKWORK_APP_ROOT"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../..")
                .canonicalize()
                .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
        })
}

fn resolve_manager_environment() -> String {
    std::env::var("SDKWORK_MANAGER_ENVIRONMENT")
        .or_else(|_| std::env::var("SDKWORK_ENVIRONMENT"))
        .map(|value| value.trim().to_owned())
        .ok()
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "development".to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repository_fallback_contains_the_manager_manifest() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
        assert!(root.join("sdkwork.app.config.json").is_file());
    }
}
