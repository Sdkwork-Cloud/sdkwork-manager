#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(repoRoot, "artifacts", "release", "release-packages.manifest.json");

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(filePath), hash);
  return hash.digest("hex");
}

function archiveEntries(archivePath) {
  const result = spawnSync("tar", ["-tzf", archivePath], { cwd: repoRoot, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`tar validation failed: ${result.stderr}`);
  return result.stdout.split(/\r?\n/u).map((entry) => entry.replace(/^\.\//u, "")).filter(Boolean);
}

assert.ok(existsSync(manifestPath), "release manifest is missing; run pnpm release:package");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert.equal(manifest.kind, "sdkwork.release.packages");
assert.equal(manifest.packages?.length, 1);
const released = manifest.packages[0];
const archivePath = path.resolve(repoRoot, released.path);
assert.ok(archivePath.startsWith(path.join(repoRoot, "artifacts", "release")));
assert.ok(existsSync(archivePath), `release archive is missing: ${released.path}`);
assert.equal(await sha256File(archivePath), released.checksum);
assert.ok(existsSync(path.resolve(repoRoot, released.sbomPath)), "release SBOM is missing");

const entries = archiveEntries(archivePath);
for (const required of [
  "bin/manager-server",
  "web/pc/index.html",
  "etc/standalone.production.env",
  "etc/sdkwork.app.config.json",
  "etc/topology.spec.json",
  "docs/LAUNCH_READINESS.md",
]) {
  assert.ok(entries.includes(required), `release archive is missing ${required}`);
}
for (const entry of entries) {
  assert.doesNotMatch(entry, /(?:^|\/)(?:\.env$|node_modules|target|\.git|.*\.pem|.*\.key)(?:\/|$)/u);
}
console.log(`[release:validate] ok (${released.path})`);
