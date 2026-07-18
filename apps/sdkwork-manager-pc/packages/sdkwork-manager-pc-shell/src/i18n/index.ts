import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { MANAGER_SHELL_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/i18n";

export function useManagerShellMessages() {
  return useSdkworkModuleMessages(MANAGER_SHELL_I18N_CATALOG);
}
