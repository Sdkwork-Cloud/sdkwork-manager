import { assertSdkworkCatalogLocaleParity } from "@sdkwork/i18n-pc-react";
import { describe, expect, it } from "vitest";

import { MANAGER_SHELL_I18N_CATALOG } from "../src/i18n/manifest";

describe("manager shell i18n catalog", () => {
  it("keeps active locale fragments in parity", () => {
    expect(() => assertSdkworkCatalogLocaleParity(MANAGER_SHELL_I18N_CATALOG)).not.toThrow();
  });

  it("resolves localized critical operator states", () => {
    expect(MANAGER_SHELL_I18N_CATALOG.resolveMessages("zh-CN").session.validating).toContain("校验");
    expect(MANAGER_SHELL_I18N_CATALOG.resolveMessages("en-US").adminHost.signOut).toBe("Sign out");
    expect(MANAGER_SHELL_I18N_CATALOG.resolveMessages("zh-CN").adminHost.switchToDarkMode).toBe("切换到深色模式");
    expect(MANAGER_SHELL_I18N_CATALOG.resolveMessages("en-US").adminHost.switchToLightMode).toBe("Switch to light mode");
  });
});
