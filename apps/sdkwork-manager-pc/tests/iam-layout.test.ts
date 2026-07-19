import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "apps/sdkwork-manager-pc/src/index.css"),
  "utf8",
);

describe("IAM access-control layout", () => {
  it("uses all width available from the admin content area", () => {
    const workspaceRule = stylesheet.match(/\.manager-iam-workspace\s*\{(?<body>[^}]*)\}/u)?.groups?.body;

    expect(workspaceRule).toBeDefined();
    expect(workspaceRule).toMatch(/\bwidth:\s*100%;/u);
    expect(workspaceRule).not.toMatch(/\bmax-width\s*:/u);
    expect(workspaceRule).not.toMatch(/\bwidth:\s*min\(/u);
  });
});
