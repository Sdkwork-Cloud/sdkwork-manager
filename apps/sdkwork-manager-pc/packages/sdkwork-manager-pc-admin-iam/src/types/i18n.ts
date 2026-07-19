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
    security: string;
  };
  routes: {
    accountBinding: { description: string; label: string };
    audit: { description: string; label: string };
    oauth: { description: string; label: string };
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
