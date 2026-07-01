#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const manifests = [
  "sdks/_route-manifests/app-api/sdkwork-routes-manager-app-api.route-manifest.json",
  "sdks/_route-manifests/backend-api/sdkwork-routes-manager-backend-api.route-manifest.json",
];

function fail(message) {
  process.stderr.write(`[manager_route_manifest_export] ${message}\n`);
  process.exit(1);
}

function readJson(relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing route manifest: ${relativePath}`);
  }
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function validateManifest(relativePath) {
  const manifest = readJson(relativePath);
  if (manifest.kind !== "sdkwork.route.manifest") {
    fail(`${relativePath} must be sdkwork.route.manifest`);
  }
  if (manifest.owner !== "sdkwork-manager") {
    fail(`${relativePath} owner must be sdkwork-manager`);
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length === 0) {
    fail(`${relativePath} must declare routes`);
  }
  for (const route of manifest.routes) {
    if (route.schemas?.problem !== "ProblemDetail") {
      fail(`${route.operationId} must declare ProblemDetail`);
    }
  }
}

for (const manifestPath of manifests) {
  validateManifest(manifestPath);
}

process.stdout.write("[manager_route_manifest_export] check ok\n");
