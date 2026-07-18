#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appManifest = JSON.parse(readFileSync(path.join(repoRoot, "sdkwork.app.config.json"), "utf8"));
const version = process.env.SDKWORK_PACKAGE_VERSION
  || appManifest.release?.currentVersion
  || appManifest.release?.version
  || "0.0.0-dev";
const bundleName = `sdkwork-manager-api-gateway-config-${version}.tar.gz`;
const bundlePath = path.join(repoRoot, "dist", "cloud-config", bundleName);
const checksumPath = `${bundlePath}.sha256`;
const sbomPath = `${bundlePath}.sbom.json`;

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function requireBundleEvidence() {
  assert.ok(existsSync(bundlePath), `cloud config bundle is missing: ${bundleName}`);
  assert.ok(existsSync(checksumPath), `cloud config checksum is missing: ${path.basename(checksumPath)}`);
  const digest = sha256(bundlePath);
  const recorded = readFileSync(checksumPath, "utf8").trim().split(/\s+/u)[0];
  assert.equal(recorded, digest, "cloud config bundle checksum does not match");
  return digest;
}

function generate() {
  const digest = requireBundleEvidence();
  const sbom = {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      component: {
        type: "application",
        name: "sdkwork-manager-cloud-gateway-config",
        version,
        hashes: [{ alg: "SHA-256", content: digest }],
        properties: [
          { name: "sdkwork:artifact", value: `dist/cloud-config/${bundleName}` },
          { name: "sdkwork:deploymentProfile", value: "cloud" },
          { name: "sdkwork:runtimeTarget", value: "container" },
          { name: "sdkwork:variant", value: "config-bundle" },
          { name: "sdkwork:binaryOwner", value: "sdkwork-api-cloud-gateway" },
        ],
      },
    },
    components: [
      { type: "application", name: "sdkwork-manager", version },
      { type: "application", name: "sdkwork-api-cloud-gateway", version: "external-runtime-owner" },
    ],
  };
  writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
  console.log(`[gateway:sbom:cloud] wrote ${path.relative(repoRoot, sbomPath)}`);
}

function validate() {
  const digest = requireBundleEvidence();
  assert.ok(existsSync(sbomPath), `cloud config SBOM is missing: ${path.basename(sbomPath)}`);
  const sbom = JSON.parse(readFileSync(sbomPath, "utf8"));
  assert.equal(sbom.bomFormat, "CycloneDX");
  assert.equal(sbom.specVersion, "1.6");
  assert.equal(sbom.metadata?.component?.name, "sdkwork-manager-cloud-gateway-config");
  assert.equal(sbom.metadata?.component?.version, version);
  assert.equal(sbom.metadata?.component?.hashes?.[0]?.content, digest);
  console.log(`[gateway:sbom:cloud:validate] ok (${path.relative(repoRoot, sbomPath)})`);
}

const command = process.argv[2] || "generate";
if (command === "generate") generate();
else if (command === "validate") validate();
else throw new Error(`unsupported cloud config SBOM command: ${command}`);
