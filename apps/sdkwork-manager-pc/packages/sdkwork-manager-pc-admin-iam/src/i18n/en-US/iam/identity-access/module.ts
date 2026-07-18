import type { ManagerIamAdminModuleMessages } from "../../../../types/i18n";

export const managerIamAdminModuleMessages: ManagerIamAdminModuleMessages = {
  channelTemplate: "{channel} channel",
  description: "Operator administration for identities, tenant boundaries, access policy, and security audit.",
  displayName: "Identity & Access",
  loading: "Loading IAM admin capability",
  routes: {
    accountBinding: { description: "Configure contact and external identity binding policies", label: "Account binding policies" },
    audit: { description: "Review security events and administrator activity", label: "Audit & security" },
    oauth: { description: "Manage OAuth providers, applications, and grants", label: "OAuth management" },
    organizations: { description: "Manage organization structure, departments, and memberships", label: "Organization management" },
    permissions: { description: "Define the resource actions available to administrators", label: "Permissions" },
    policies: { description: "Maintain reusable authorization policy definitions", label: "Policies" },
    roleBindings: { description: "Assign roles to principals within a controlled scope", label: "Role bindings" },
    roles: { description: "Create roles and manage their permission assignments", label: "Roles" },
    tenants: { description: "Manage tenant boundaries, status, and members", label: "Tenant management" },
    users: { description: "Manage the user directory and account lifecycle", label: "User management" },
  },
  title: "Identity & Access",
};
