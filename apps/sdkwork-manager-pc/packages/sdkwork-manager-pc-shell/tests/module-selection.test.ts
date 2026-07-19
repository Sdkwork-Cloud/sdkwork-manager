import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  createAdminModuleAccessScope,
  createSdkworkCoreHostRegistry,
  type AdminModuleContribution,
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

const identityModule: AdminModuleContribution = {
  access: {},
  capability: "identity-access",
  commercial: { entitlementKey: "sdkwork.iam.admin", releaseChannel: "stable", tier: "foundation" },
  defaultPath: "/workspace/identity/users",
  displayName: "Identity & access",
  domain: "iam",
  header: { description: "Identity administration", title: "Identity & access" },
  id: "iam.identity-access",
  packageName: "@sdkwork/manager-pc-admin-iam",
  pathPrefix: "/workspace/identity",
  routes: [
    { Component: () => null, id: "iam.users", label: "Users", path: "/workspace/identity/users" },
    { Component: () => null, id: "iam.tenants", label: "Tenants", path: "/workspace/identity/tenants" },
  ],
  surface: "backend-admin",
};

describe("manager header module selection", () => {
  it("keeps a module selected on a non-default route without URL convention matching", () => {
    const registry = createSdkworkCoreHostRegistry([identityModule]);
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: ["/workspace/identity/tenants"] },
      createElement(AdminHostShell, {
        accessScope: createAdminModuleAccessScope(),
        locale: "en-US",
        onLocaleChange: () => undefined,
        onSignOut: async () => undefined,
        registry,
      }),
    ));

    expect(html).toContain('class="manager-module-switcher is-active"');
    expect(html).toContain('aria-current="page"');
  });

  it("lets an embedded route own the full content area spacing", () => {
    const edgeToEdgeModule: AdminModuleContribution = {
      ...identityModule,
      routes: identityModule.routes.map((route, index) => (
        index === 0 ? { ...route, contentLayout: "edge-to-edge" } : route
      )),
    };
    const registry = createSdkworkCoreHostRegistry([edgeToEdgeModule]);
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: ["/workspace/identity/users"] },
      createElement(AdminHostShell, {
        accessScope: createAdminModuleAccessScope(),
        locale: "en-US",
        onLocaleChange: () => undefined,
        onSignOut: async () => undefined,
        registry,
      }),
    ));

    expect(html).toContain('class="manager-main-content manager-main-content--edge-to-edge"');
  });
});
