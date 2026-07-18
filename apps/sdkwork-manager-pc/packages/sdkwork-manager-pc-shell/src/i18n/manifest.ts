import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { managerAdminHostMessages as enAdminHost } from "./en-US/platform/manager-shell/admin-host";
import { managerAuthMessages as enAuth } from "./en-US/platform/manager-shell/auth";
import { managerIntegrationMessages as enIntegration } from "./en-US/platform/manager-shell/integration";
import { managerSessionMessages as enSession } from "./en-US/platform/manager-shell/session";
import { managerAdminHostMessages as zhAdminHost } from "./zh-CN/platform/manager-shell/admin-host";
import { managerAuthMessages as zhAuth } from "./zh-CN/platform/manager-shell/auth";
import { managerIntegrationMessages as zhIntegration } from "./zh-CN/platform/manager-shell/integration";
import { managerSessionMessages as zhSession } from "./zh-CN/platform/manager-shell/session";
import type { ManagerShellMessages } from "../types/i18n";

export const MANAGER_SHELL_I18N_CATALOG = createSdkworkMessageCatalog<ManagerShellMessages>({
  defaultLocale: "zh-CN",
  locales: {
    "en-US": {
      adminHost: enAdminHost,
      auth: enAuth,
      integration: enIntegration,
      session: enSession,
    },
    "zh-CN": {
      adminHost: zhAdminHost,
      auth: zhAuth,
      integration: zhIntegration,
      session: zhSession,
    },
  },
  namespace: "platform.managerShell",
});
