import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "@sdkwork/manager-pc-admin-iam";
import {
  MANAGER_SHELL_I18N_CATALOG,
  ManagerPcApp,
} from "@sdkwork/manager-pc-shell";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";

import { createManagerAdminModuleAssembly } from "./bootstrap/adminModuleAssembly";
import {
  commitManagerLocale,
  resolveInitialManagerLocale,
} from "./bootstrap/i18n";
import "./index.css";

const initialLocale = resolveInitialManagerLocale();

function ManagerPcRoot() {
  const [locale, setLocale] = useState(initialLocale);
  const modules = useMemo(() => createManagerAdminModuleAssembly(locale), [locale]);

  const handleLocaleChange = (nextLocale: string) => {
    setLocale(commitManagerLocale(nextLocale));
  };

  return (
    <SdkworkI18nProvider
      catalogs={[MANAGER_SHELL_I18N_CATALOG, MANAGER_IAM_ADMIN_I18N_CATALOG]}
      locale={locale}
    >
      <SdkworkThemeProvider defaultTheme="light" locale={locale} themeColor="green-tech">
        <ManagerPcApp
          locale={locale}
          modules={modules}
          onLocaleChange={handleLocaleChange}
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
