import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  createAdminModuleAccessScope,
  createSdkworkCoreHostRegistry,
} from "@sdkwork/manager-pc-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const themeState = vi.hoisted(() => ({
  colorMode: "light" as "dark" | "light",
  setThemeSelection: vi.fn(),
}));

vi.mock("@sdkwork/ui-pc-react/theme", () => ({
  useSdkworkTheme: () => ({
    colorMode: themeState.colorMode,
    setThemeSelection: themeState.setThemeSelection,
  }),
}));

vi.mock("../src/i18n", () => ({
  useManagerShellMessages: () => ({
    adminHost: {
      accountCenter: "Account center",
      adminBadge: "Admin",
      brandLabel: "SDKWork Manager",
      capability: "Capability",
      capabilityNavigation: "Capability navigation",
      commercialModulesNote: "Commercial modules",
      commercialTier: "Commercial tier",
      english: "English",
      hideModuleNavigation: "Hide module navigation",
      language: "Language",
      moduleAssemblyDescription: "Registered management modules",
      moduleAssemblyTitle: "Module assembly",
      moduleNavigation: "Module navigation",
      navigationCountTemplate: "{count} capabilities",
      noAvailableCapabilities: "No capabilities",
      registeredModules: "Registered modules",
      releaseChannel: "Release channel",
      searchModules: "Search modules",
      selectModule: "Select a module",
      showModuleNavigation: "Show module navigation",
      signOut: "Sign out",
      simplifiedChinese: "Simplified Chinese",
      switchToDarkMode: "Switch to dark mode",
      switchToLightMode: "Switch to light mode",
      unifiedWorkspace: "Unified workspace",
      workspace: "Workspace",
    },
  }),
}));

import { AdminHostShell } from "../src/admin-host-shell";

function createShell(themeSelection: "dark" | "light") {
  themeState.colorMode = themeSelection;
  return createElement(
    MemoryRouter,
    null,
    createElement(
      AdminHostShell,
      {
        accessScope: createAdminModuleAccessScope(),
        locale: "en-US",
        onLocaleChange: () => undefined,
        onSignOut: async () => undefined,
        registry: createSdkworkCoreHostRegistry([]),
      },
    ),
  );
}

function renderShell(themeSelection: "dark" | "light") {
  return renderToStaticMarkup(createShell(themeSelection));
}

describe("manager header theme toggle", () => {
  beforeEach(() => {
    themeState.setThemeSelection.mockClear();
  });

  it("offers dark mode from the light theme", () => {
    const html = renderShell("light");

    expect(html).toContain("manager-theme-toggle");
    expect(html).toContain('aria-label="Switch to dark mode"');
    expect(html).toContain("lucide-moon");
  });

  it("offers light mode from the dark theme", () => {
    const html = renderShell("dark");

    expect(html).toContain('aria-label="Switch to light mode"');
    expect(html).toContain("lucide-sun");
  });

  it("selects the opposite theme when activated", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(createShell("light"));
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".manager-theme-toggle")?.click();
    });

    expect(themeState.setThemeSelection).toHaveBeenCalledWith("dark");

    await act(async () => root.unmount());
  });
});
