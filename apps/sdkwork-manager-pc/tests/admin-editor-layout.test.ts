import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), "apps/sdkwork-manager-pc", path), "utf8");
}

describe("admin editor layout", () => {
  it("renders manager-owned create and edit workflows in drawers", () => {
    const sources = [
      readSource("packages/sdkwork-manager-pc-admin-iam/src/authorization/IamCatalogWorkspace.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-iam/src/oauth/IamOauthAccountWorkspace.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-marketing/src/index.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-membership/src/index.tsx"),
    ];

    for (const source of sources) {
      expect(source).toMatch(/<(?:Operation)?Drawer/u);
      expect(source).not.toContain('className="manager-operation-form"');
    }
  });

  it("keeps OAuth account errors and table navigation inside the active workflow", () => {
    const source = readSource("packages/sdkwork-manager-pc-admin-iam/src/oauth/IamOauthAccountWorkspace.tsx");

    expect(source).toContain("drawerError");
    expect(source).toContain('role="region"');
    expect(source).toContain('role="alert"');
    expect(source).toContain("messages.filters.clear");
  });

  it("does not render page-level titles in manager-owned route content", () => {
    const sources = [
      readSource("packages/sdkwork-manager-pc-admin-iam/src/authorization/IamCatalogWorkspace.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-iam/src/oauth/IamOauthOverview.tsx"),
    ];

    for (const source of sources) {
      expect(source).not.toMatch(/<header\b/u);
      expect(source).not.toMatch(/<h1\b/u);
    }
  });

  it("suppresses dependency-owned route headers without hiding section headers", () => {
    const stylesheet = readSource("src/index.css");

    expect(stylesheet).toContain('[data-slot="management-workbench-header"]');
    expect(stylesheet).toContain('[data-slot="settings-section"]:first-child');
  });

  it("uses product dialogs and local data refresh instead of browser-native interruptions", () => {
    const sources = [
      readSource("packages/sdkwork-manager-pc-admin-iam/src/authorization/IamCatalogWorkspace.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-marketing/src/index.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-membership/src/index.tsx"),
      readSource("packages/sdkwork-manager-pc-admin-trade/src/index.tsx"),
    ];

    for (const source of sources) {
      expect(source).not.toContain("window.confirm");
      expect(source).not.toContain("window.location.reload");
    }
  });

  it("defines a consistent dense table and status presentation", () => {
    const stylesheet = readSource("src/index.css");

    expect(stylesheet).toContain(".manager-status-badge");
    expect(stylesheet).toContain("position: sticky");
    expect(stylesheet).toContain(".manager-action-danger");
    expect(stylesheet).toContain("font-variant-numeric: tabular-nums");
  });

  it("keeps the mobile sign-in form inside the viewport and removes the unusable QR panel", () => {
    const stylesheet = readSource("src/index.css");

    expect(stylesheet).toContain("width: calc(100vw - 24px) !important");
    expect(stylesheet).toContain(".sdkwork-manager-auth-host .manager-auth-aside-panel");
    expect(stylesheet).toContain(".sdkwork-manager-auth-host .manager-auth-body");
  });
});
