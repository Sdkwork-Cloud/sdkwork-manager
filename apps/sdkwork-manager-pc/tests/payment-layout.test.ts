import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "apps/sdkwork-manager-pc/src/index.css"),
  "utf8",
);

describe("payment administration layout", () => {
  it("scans every authored payment admin package for Tailwind utilities", () => {
    for (const packageName of ["core", "channel", "provider", "monitor", "devconfig"]) {
      expect(stylesheet).toContain(
        `sdkwork-payment-pc-admin-${packageName}/src`,
      );
    }
  });

  it("keeps payment presentation scoped to payment workspaces", () => {
    for (const workspace of ["monitor", "provider", "channel", "devconfig"]) {
      expect(stylesheet).toContain(
        `[data-slot="payment-${workspace}-admin-workspace"]`,
      );
    }
    expect(stylesheet).toContain("container-name: manager-payment");
    expect(stylesheet).toMatch(
      /\[data-slot="payment-devconfig-admin-workspace"\][\s\S]*?width: 100%;[\s\S]*?max-width: none;[\s\S]*?min-width: 0;/,
    );
  });

  it("defines commercial data surfaces and narrow workspace fallbacks", () => {
    expect(stylesheet).toContain('[data-slot="data-table-surface"]');
    expect(stylesheet).toContain("ul:not([role]) > li:hover");
    expect(stylesheet).toContain("@container manager-payment (max-width: 760px)");
    expect(stylesheet).toContain("@container manager-payment (max-width: 480px)");
  });
});
