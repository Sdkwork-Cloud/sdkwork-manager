#[test]
fn owner_assembly_does_not_project_dependency_routers_or_install_framework() {
    let source = include_str!("../src/bootstrap.rs");

    assert!(source.contains("ManagerApiRuntime"));
    assert!(source.contains("sdkwork_routes_manager_app_api::gateway_mount"));
    assert!(source.contains("sdkwork_routes_manager_backend_api::gateway_mount"));
    assert!(!source.contains("sdkwork_api_iam_assembly"));
    assert!(!source.contains(".router"));
    assert!(!source.contains("wrap_router_with"));
}
