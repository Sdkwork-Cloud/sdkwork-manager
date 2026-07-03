import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("workspace declares sdkwork-web-framework and sdkwork-database deps", () => {
  const cargo = readFileSync(path.join(root, "Cargo.toml"), "utf8");
  assert.match(cargo, /sdkwork-web-core/);
  assert.match(cargo, /sdkwork-web-axum/);
  assert.match(cargo, /sdkwork-database-config/);
  assert.match(cargo, /sdkwork-database-lifecycle/);
  assert.doesNotMatch(cargo, /sdkwork-discovery/);
});

test("tsconfig wires sdkwork utils", () => {
  const tsconfig = JSON.parse(readFileSync(path.join(root, "tsconfig.base.json"), "utf8"));
  assert.ok(tsconfig.compilerOptions.paths["@sdkwork/utils"]);
});

test("component spec declares platform manager capability", () => {
  const spec = JSON.parse(readFileSync(path.join(root, "specs/component.spec.json"), "utf8"));
  assert.equal(spec.component.domain, "platform");
  assert.equal(spec.component.capability, "manager");
});

test("package scripts follow PNPM_SCRIPT_SPEC minimum surface", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  for (const script of ["dev", "build", "test", "check", "verify", "clean"]) {
    assert.ok(pkg.scripts[script], `missing script: ${script}`);
  }
});

test("vite production aliases include sdk-common for generated SDK bundles", () => {
  const viteConfig = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/vite.config.ts"),
    "utf8",
  );
  assert.match(viteConfig, /@sdkwork\/sdk-common/);
  assert.match(viteConfig, /sdkwork-manager-app-sdk-generated-typescript/);
});

test("verify pipeline includes production build and gateway validation", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.verify, /pnpm build/);
  assert.match(pkg.scripts.verify, /gateway:validate:cloud/);
});

test("launch readiness runbook documents IAM bootstrap via sdkwork-iam", () => {
  const runbook = readFileSync(path.join(root, "docs/runbooks/LAUNCH_READINESS.md"), "utf8");
  const docsIndex = readFileSync(path.join(root, "docs/INDEX.yaml"), "utf8");
  assert.match(runbook, /--appbase-root sdkwork-iam/);
  assert.match(runbook, /bootstrap-all-apps\.mjs --filter sdkwork-manager/);
  assert.match(docsIndex, /launchReadiness: docs\/runbooks\/LAUNCH_READINESS\.md/);
});
