import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/i18n";

export function useManagerIamAdminMessages() {
  return useSdkworkModuleMessages(MANAGER_IAM_ADMIN_I18N_CATALOG);
}
