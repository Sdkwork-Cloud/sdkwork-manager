import { Moon, PanelsTopLeft, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useManagerShellMessages } from "../i18n";

type AuthThemeMode = "dark" | "light";

function isDesktopRuntime(): boolean {
  return typeof window !== "undefined" && !!(globalThis as Record<string, unknown>).__TAURI__;
}

export function ManagerAuthShell({ children }: { children: ReactNode }) {
  const { adminHost, auth } = useManagerShellMessages();
  const [themeMode, setThemeMode] = useState<AuthThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const isLightMode = themeMode === "light";
  const shouldRenderDesktopHeader = isDesktopRuntime();

  useEffect(() => {
    document.documentElement.classList.toggle("sdkwork-manager-auth-light-mode", isLightMode);
    document.documentElement.classList.add("sdkwork-manager-auth-active");
    document.documentElement.style.colorScheme = themeMode;
    document.body.classList.add("sdkwork-manager-auth-active");

    return () => {
      document.documentElement.classList.remove("sdkwork-manager-auth-light-mode");
      document.documentElement.classList.remove("sdkwork-manager-auth-active");
      document.documentElement.style.removeProperty("color-scheme");
      document.body.classList.remove("sdkwork-manager-auth-active");
    };
  }, [isLightMode, themeMode]);

  const toggleTheme = () => {
    setThemeMode((current) => (current === "light" ? "dark" : "light"));
  };
  const themeToggleLabel = isLightMode ? auth.switchToDarkMode : auth.switchToLightMode;

  return (
    <div className="sdkwork-manager-auth-host" data-sdk-color-mode={themeMode}>
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
