import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "@sdkwork/manager-pc-admin-iam";
import { PAYMENT_ADMIN_I18N_CATALOG } from "@sdkwork/manager-pc-admin-payment";
import {
  MANAGER_SHELL_I18N_CATALOG,
  logManagerSessionPageBoot,
  ManagerPcApp,
} from "@sdkwork/manager-pc-shell";
import { ManagerCurrentOperatorUserCenter } from "@sdkwork/manager-pc-user";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import type { SdkworkThemeSelection } from "@sdkwork/ui-pc-react/theme";

import { createManagerAdminModuleAssembly } from "./bootstrap/adminModuleAssembly";
import {
  commitManagerLocale,
  resolveInitialManagerLocale,
} from "./bootstrap/i18n";
import {
  commitManagerTheme,
  MANAGER_THEME_COLOR,
  resolveInitialManagerTheme,
} from "./bootstrap/theme";
import "./index.css";

const initialLocale = resolveInitialManagerLocale();
const initialTheme = resolveInitialManagerTheme();
logManagerSessionPageBoot(window.location.search);

function ManagerPcRoot() {
  const [locale, setLocale] = useState(initialLocale);
  const [themeSelection, setThemeSelection] = useState(initialTheme);
  const modules = useMemo(() => createManagerAdminModuleAssembly(locale), [locale]);

  const handleLocaleChange = (nextLocale: string) => {
    setLocale(commitManagerLocale(nextLocale));
  };

  const handleThemeSelectionChange = (nextTheme: SdkworkThemeSelection) => {
    setThemeSelection(commitManagerTheme(nextTheme));
  };

  return (
    <SdkworkI18nProvider
      catalogs={[
        MANAGER_SHELL_I18N_CATALOG,
        MANAGER_IAM_ADMIN_I18N_CATALOG,
        PAYMENT_ADMIN_I18N_CATALOG,
      ]}
      locale={locale}
    >
      <SdkworkThemeProvider
        locale={locale}
        onThemeSelectionChange={handleThemeSelectionChange}
        themeColor={MANAGER_THEME_COLOR}
        themeSelection={themeSelection}
      >
        <ManagerPcApp
          locale={locale}
          modules={modules}
          onLocaleChange={handleLocaleChange}
          renderUserCenter={() => <ManagerCurrentOperatorUserCenter locale={locale} />}
        />
      </SdkworkThemeProvider>
    </SdkworkI18nProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ManagerPcRoot />
  </StrictMode>,
);
