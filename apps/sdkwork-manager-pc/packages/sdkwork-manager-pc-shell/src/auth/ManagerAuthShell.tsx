import { Moon, PanelsTopLeft, Sun } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useSdkworkTheme } from "@sdkwork/ui-pc-react/theme";

import { useManagerShellMessages } from "../i18n";

function isDesktopRuntime(): boolean {
  return typeof window !== "undefined" && !!(globalThis as Record<string, unknown>).__TAURI__;
}

export function ManagerAuthShell({ children }: { children: ReactNode }) {
  const { adminHost, auth } = useManagerShellMessages();
  const { colorMode, setThemeSelection } = useSdkworkTheme();
  const isLightMode = colorMode === "light";
  const shouldRenderDesktopHeader = isDesktopRuntime();

  useEffect(() => {
    document.documentElement.classList.toggle("sdkwork-manager-auth-light-mode", isLightMode);
    document.documentElement.classList.add("sdkwork-manager-auth-active");
    document.body.classList.add("sdkwork-manager-auth-active");

    return () => {
      document.documentElement.classList.remove("sdkwork-manager-auth-light-mode");
      document.documentElement.classList.remove("sdkwork-manager-auth-active");
      document.body.classList.remove("sdkwork-manager-auth-active");
    };
  }, [isLightMode]);

  const toggleTheme = () => {
    setThemeSelection(isLightMode ? "dark" : "light");
  };
  const themeToggleLabel = isLightMode ? auth.switchToDarkMode : auth.switchToLightMode;

  return (
    <div className="sdkwork-manager-auth-host" data-sdk-color-mode={colorMode}>
      {shouldRenderDesktopHeader ? (
        <header className="sdkwork-manager-auth-header drag-region">
          <div className="sdkwork-manager-auth-header-brand">
            <span className="sdkwork-manager-auth-header-mark">
              <PanelsTopLeft aria-hidden="true" size={12} />
            </span>
            <span>{adminHost.brandLabel}</span>
          </div>
          <div className="sdkwork-manager-auth-header-center" />
          <div className="sdkwork-manager-auth-header-actions no-drag">
            <button
              aria-label={themeToggleLabel}
              className="sdkwork-manager-auth-theme-button"
              onClick={toggleTheme}
              title={themeToggleLabel}
              type="button"
            >
              {isLightMode ? <Moon aria-hidden="true" size={14} /> : <Sun aria-hidden="true" size={14} />}
            </button>
          </div>
        </header>
      ) : null}
      <main className="sdkwork-manager-auth-main">{children}</main>
    </div>
  );
}
