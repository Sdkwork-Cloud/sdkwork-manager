import { membershipWorkspaceEn } from "./en-US/commerce/membership/workspace";
import { membershipWorkspaceZh } from "./zh-CN/commerce/membership/workspace";

export function resolveMembershipMessages(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? membershipWorkspaceZh : membershipWorkspaceEn;
}
