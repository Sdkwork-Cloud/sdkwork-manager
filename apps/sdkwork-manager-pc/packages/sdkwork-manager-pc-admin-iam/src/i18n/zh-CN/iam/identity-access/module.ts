import type { ManagerIamAdminModuleMessages } from "../../../../types/i18n";

export const managerIamAdminModuleMessages: ManagerIamAdminModuleMessages = {
  channelTemplate: "{channel} 通道",
  description: "面向管理员的用户身份、租户边界、组织架构、访问策略与安全审计工作台。",
  displayName: "身份与访问",
  loading: "正在加载身份与访问管理功能",
  routes: {
    accountBinding: { description: "配置联系方式与第三方身份绑定策略", label: "账号绑定策略" },
    audit: { description: "查看安全事件与管理员操作记录", label: "审计与安全" },
    oauth: { description: "管理 OAuth 提供商、应用与授权", label: "OAuth 管理" },
    organizations: { description: "管理组织架构、部门与成员关系", label: "组织管理" },
    permissions: { description: "Define administrator resource actions", label: "Permissions" },
    policies: { description: "Maintain authorization policy definitions", label: "Policies" },
    roleBindings: { description: "Assign roles within a controlled scope", label: "Role bindings" },
    roles: { description: "Manage roles and permission assignment", label: "Roles" },
    tenants: { description: "管理租户边界、状态与成员", label: "租户管理" },
    users: { description: "管理用户目录与账号生命周期", label: "用户管理" },
  },
  title: "身份与访问",
};
