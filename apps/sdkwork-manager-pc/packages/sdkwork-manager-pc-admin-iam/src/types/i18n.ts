export interface ManagerIamAdminModuleMessages {
  channelTemplate: string;
  catalog: {
    accessControlTemplate: string;
    countTemplate: string;
    labels: {
      permission: string;
      policy: string;
      role: string;
    };
    loadingTemplate: string;
    editor: {
      action: string;
      cancel: string;
      code: string;
      createTemplate: string;
      editTemplate: string;
      name: string;
      resource: string;
      save: string;
      status: string;
    };
    table: {
      action: string;
      actions: string;
      code: string;
      delete: string;
      edit: string;
      empty: string;
      name: string;
      resource: string;
      status: string;
    };
    notices: {
      deleteConfirmTemplate: string;
      deleteError: string;
      deleteSuccess: string;
      loadError: string;
      saveError: string;
      saveSuccess: string;
    };
  };
  description: string;
  displayName: string;
  loading: string;
  navigationGroups: {
    accessControl: string;
    directory: string;
    federation: string;
    oauth: string;
    security: string;
  };
  oauthOverview: {
    attention: string;
    countTemplate: string;
    description: string;
    eyebrow: string;
    inventoryDescription: string;
    inventoryTitle: string;
    loadError: string;
    loading: string;
    ready: string;
    title: string;
    checks: {
      applications: { description: string; label: string };
      governance: { description: string; label: string };
      observability: { description: string; label: string };
      providers: { description: string; label: string };
    };
    inventory: {
      activity: { description: string; label: string };
      authorizations: { description: string; label: string };
      governance: { description: string; label: string };
      loginConfiguration: { description: string; label: string };
      providers: { description: string; label: string };
      resources: { description: string; label: string };
    };
    metrics: {
      applications: string;
      grants: string;
      integrations: string;
      providers: string;
    };
    readinessDescription: string;
    readinessTitle: string;
  };
  routes: {
    accountBinding: { description: string; label: string };
    audit: { description: string; label: string };
    oauth: { description: string; label: string };
    oauthActivity: { description: string; label: string };
    oauthApplications: { description: string; label: string };
    oauthAuthorizations: { description: string; label: string };
    oauthGovernance: { description: string; label: string };
    oauthLoginConfiguration: { description: string; label: string };
    oauthProviders: { description: string; label: string };
    oauthResources: { description: string; label: string };
    organizations: { description: string; label: string };
    permissions: { description: string; label: string };
    policies: { description: string; label: string };
    roleBindings: { description: string; label: string };
    roles: { description: string; label: string };
    tenants: { description: string; label: string };
    users: { description: string; label: string };
  };
  title: string;
}

export interface ManagerIamAdminMessages {
  module: ManagerIamAdminModuleMessages;
}
