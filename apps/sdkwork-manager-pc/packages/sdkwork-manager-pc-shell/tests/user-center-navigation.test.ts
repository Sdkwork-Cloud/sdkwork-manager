import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  createAdminModuleAccessScope,
  createSdkworkCoreHostRegistry,
} from "@sdkwork/manager-pc-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("@sdkwork/ui-pc-react/theme", () => ({
  useSdkworkTheme: () => ({
    colorMode: "light",
    setThemeSelection: vi.fn(),
  }),
}));

vi.mock("../src/i18n", () => ({
  useManagerShellMessages: () => ({
    adminHost: {
      accountCenter: "Account center",
      adminBadge: "Admin",
      brandLabel: "SDKWork Manager",
      english: "English",
      hideModuleNavigation: "Hide module navigation",
      language: "Language",
      moduleNavigation: "Module navigation",
      noAvailableCapabilities: "No capabilities",
      registeredModules: "Registered modules",
      searchModules: "Search modules",
      selectModule: "Select a module",
      showModuleNavigation: "Show module navigation",
      signOut: "Sign out",
      simplifiedChinese: "Simplified Chinese",
      switchToDarkMode: "Switch to dark mode",
      switchToLightMode: "Switch to light mode",
      workspace: "Workspace",
    },
  }),
}));

import { AdminHostShell } from "../src/admin-host-shell";

describe("manager current-operator user center", () => {
  it("keeps the account center available without admin permissions", () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/account"] },
        createElement(AdminHostShell, {
          accessScope: createAdminModuleAccessScope(),
          locale: "en-US",
          onLocaleChange: () => undefined,
          onSignOut: async () => undefined,
          registry: createSdkworkCoreHostRegistry([]),
          UserCenterComponent: () => createElement("section", null, "Current operator security"),
        }),
      ),
    );

    expect(html).toContain('aria-label="Account center"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Current operator security");
    expect(html).not.toContain("manager-sidebar");
  });
});
