import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("Manager workflow packages the standalone server instead of skipping it", () => {
  const workflow = JSON.parse(readFileSync(path.join(root, "sdkwork.workflow.json"), "utf8"));
  const packageScript = workflow.lifecycle.package.map((step) => step.run).join("\n");
  assert.match(packageScript, /cargo build --release/);
  assert.match(packageScript, /pnpm release:package/);
  assert.match(packageScript, /pnpm release:validate/);
  assert.ok(workflow.dependencies.some((dependency) => dependency.id === "sdkwork-specs"));
});

test("Manager release scripts require binary, web, config, checksum, and SBOM evidence", () => {
  const packager = readFileSync(path.join(root, "scripts/release/package-manager-server.mjs"), "utf8");
  const validator = readFileSync(path.join(root, "scripts/release/validate-manager-release.mjs"), "utf8");
  for (const marker of ["bin", "web", "standalone.production.env", "SHA-256", "CycloneDX"]) {
    assert.match(packager, new RegExp(marker.replace(".", "\\.")));
  }
  assert.match(validator, /web\/pc\/index\.html/);
  assert.match(validator, /release SBOM is missing/);
});

test("Manager cloud config target generates and validates its own SBOM evidence", () => {
  const workflow = JSON.parse(readFileSync(path.join(root, "sdkwork.workflow.json"), "utf8"));
  const sbomScript = workflow.lifecycle.sbom.map((step) => step.run).join("\n");
  const validateScript = workflow.lifecycle.validate.map((step) => step.run).join("\n");
  const cloudTarget = workflow.targets.find((target) => target.variant === "config-bundle");
  const cloudSbom = readFileSync(path.join(root, "scripts/release/cloud-config-sbom.mjs"), "utf8");
  assert.match(sbomScript, /gateway:sbom:cloud/);
  assert.match(validateScript, /gateway:sbom:cloud:validate/);
  assert.match(cloudSbom, /sdkwork:binaryOwner/);
  assert.match(cloudSbom, /SHA-256/);
  assert.ok(cloudTarget.outputGlobs.some((glob) => glob.endsWith(".sha256")));
  assert.ok(cloudTarget.outputGlobs.some((glob) => glob.endsWith(".sbom.json")));
});
