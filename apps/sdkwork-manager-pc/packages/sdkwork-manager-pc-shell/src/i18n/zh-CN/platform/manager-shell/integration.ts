import type { ManagerIntegrationMessages } from "../../../../types/i18n";

export const managerIntegrationMessages: ManagerIntegrationMessages = {
  accessDescription: "导航可见性来自 IAM 会话权限范围；每项操作最终仍由所属后端服务执行授权判定。",
  accessEyebrow: "访问受限",
  accessTitle: "当前管理员权限范围无法访问所请求的能力",
  description: "此主机路由负责定义后台模块共用的路由命名空间、页头契约、导航框架和模块生命周期。",
  displayName: "集成",
  eyebrow: "主机能力",
  headerDescription: "产品后台模块的装配、路由、权益元数据与生命周期约定。",
  headerTitle: "集成",
  lifecycleRule: "模块元数据声明商业可用性，并由所属后端服务实施最终校验。",
  moduleOwnershipRule: "各模块包自行声明后端 SDK 依赖和管理员权限。",
  overview: "概览",
  remoteCodeRule: "主机在构建时组合稳定的包导出，已认证的浏览器会话不会加载任意远程代码。",
  routeDescription: "主机集成契约",
  title: "集成控制面",
};
