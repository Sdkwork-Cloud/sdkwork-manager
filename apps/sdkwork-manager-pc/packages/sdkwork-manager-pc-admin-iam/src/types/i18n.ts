export interface ManagerIamAdminModuleMessages {
  channelTemplate: string;
  description: string;
  displayName: string;
  loading: string;
  routes: {
    accountBinding: { description: string; label: string };
    audit: { description: string; label: string };
    authorization: { description: string; label: string };
    oauth: { description: string; label: string };
    organizations: { description: string; label: string };
    tenants: { description: string; label: string };
    users: { description: string; label: string };
  };
  title: string;
}

export interface ManagerIamAdminMessages {
  module: ManagerIamAdminModuleMessages;
}
