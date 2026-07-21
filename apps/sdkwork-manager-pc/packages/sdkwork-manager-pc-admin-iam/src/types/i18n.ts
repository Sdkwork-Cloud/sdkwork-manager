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
  oauthAccounts: ManagerIamOauthAccountMessages;
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
    organizationStructure: { description: string; label: string };
    permissions: { description: string; label: string };
    policies: { description: string; label: string };
    roleBindings: { description: string; label: string };
    roles: { description: string; label: string };
    tenants: { description: string; label: string };
    users: { description: string; label: string };
  };
  title: string;
}

export interface ManagerIamOauthAccountMessages {
  actions: {
    add: string;
    cancel: string;
    edit: string;
    retry: string;
    save: string;
    saving: string;
  };
  applicationAccess: {
    description: string;
    empty: string;
    title: string;
  };
  empty: {
    accounts: string;
    applications: string;
    filtered: string;
  };
  errors: {
    load: string;
    save: string;
    status: string;
  };
  filters: {
    allProviders: string;
    clear: string;
    searchPlaceholder: string;
  };
  form: {
    appId: string;
    appIdHint: string;
    application: string;
    callbackUrl: string;
    callbackUrlHint: string;
    createDescription: string;
    createTitle: string;
    displayName: string;
    editDescription: string;
    editTitle: string;
    enabled: string;
    environment: string;
    miniProgramEnvironment: string;
    miniProgramOriginalId: string;
    miniProgramOriginalIdHint: string;
    provider: string;
    providerTenantId: string;
    providerTenantIdHint: string;
    secret: string;
    secretHint: string;
  };
  kind: {
    miniProgram: string;
    oauth: string;
    officialAccount: string;
  };
  loading: string;
  status: {
    disabled: string;
    enabled: string;
    missingSecret: string;
    ready: string;
    unbound: string;
  };
  summary: {
    accounts: string;
    applications: string;
    enabled: string;
    missingSecret: string;
  };
  table: {
    account: string;
    actions: string;
    application: string;
    credential: string;
    environment: string;
    platform: string;
    status: string;
  };
}

export interface ManagerIamAdminMessages {
  module: ManagerIamAdminModuleMessages;
}
