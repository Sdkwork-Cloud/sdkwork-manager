import { customerWorkspaceEn } from "./en-US/platform/customer/workspace";
import { customerWorkspaceZh } from "./zh-CN/platform/customer/workspace";

export function resolveCustomerMessages(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? customerWorkspaceZh : customerWorkspaceEn;
}
