import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { managerIamAdminModuleMessages as enModule } from "./en-US/iam/identity-access/module";
import { managerIamAdminModuleMessages as zhModule } from "./zh-CN/iam/identity-access/module";
import type { ManagerIamAdminMessages } from "../types/i18n";

export const MANAGER_IAM_ADMIN_I18N_CATALOG = createSdkworkMessageCatalog<ManagerIamAdminMessages>({
  defaultLocale: "zh-CN",
  locales: {
    "en-US": { module: enModule },
    "zh-CN": { module: zhModule },
  },
  namespace: "iam.identityAccess.managerAdapter",
});
