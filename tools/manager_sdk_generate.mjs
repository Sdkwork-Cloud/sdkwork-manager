#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const STANDARD_PROFILE = "sdkwork-v3";
const GENERATOR_BIN = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "sdkwork-sdk-generator",
  "bin",
  "sdkgen.js",
);
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const families = [
  {
    familyName: "sdkwork-manager-app-sdk",
    authorityName: "sdkwork-manager-app-api",
    sdkType: "app",
    apiPrefix: "/app/v3/api",
    sourceRouteCrate: "sdkwork-routes-manager-app-api",
    routeManifest: "sdks/_route-manifests/app-api/sdkwork-routes-manager-app-api.route-manifest.json",
    sourceOpenapi: "apis/app-api/manager/manager-app-api.openapi.json",
    defaultBaseUrl: "http://127.0.0.1:18092",
    sdkDependencies: [],
  },
  {
    familyName: "sdkwork-manager-backend-sdk",
    authorityName: "sdkwork-manager-backend-api",
    sdkType: "backend",
    apiPrefix: "/backend/v3/api",
    sourceRouteCrate: "sdkwork-routes-manager-backend-api",
    routeManifest:
      "sdks/_route-manifests/backend-api/sdkwork-routes-manager-backend-api.route-manifest.json",
    sourceOpenapi: "apis/backend-api/manager/manager-backend-api.openapi.json",
    defaultBaseUrl: "http://127.0.0.1:18092",
    sdkDependencies: [],
  },
];

function fail(message) {
  process.stderr.write(`[manager_sdk_generate] ${message}\n`);
  process.exit(1);
}

function resolveRoot(relativeOrAbsolute) {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.resolve(workspaceRoot, relativeOrAbsolute);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function collectOperations(openapi) {
  const operations = [];
  for (const [pathKey, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method)) {
        continue;
      }
      operations.push({
        method: method.toUpperCase(),
        path: pathKey,
        operationId: operation.operationId,
      });
    }
  }
  return operations.sort((left, right) =>
    `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`),
  );
}

function validateRouteManifest(family, openapiOperations) {
  const manifestPath = resolveRoot(family.routeManifest);
  if (!existsSync(manifestPath)) {
    throw new Error(`missing route manifest: ${family.routeManifest}`);
  }
  const manifest = readJson(manifestPath);
  if (manifest.owner !== "sdkwork-manager") {
    throw new Error(`${family.routeManifest} owner mismatch`);
  }
  if (manifest.apiAuthority !== family.authorityName) {
    throw new Error(`${family.routeManifest} authority mismatch`);
  }
  const manifestKeys = manifest.routes
    .map((route) => `${route.method} ${route.path} ${route.operationId}`)
    .sort();
  const openapiKeys = openapiOperations
    .map((operation) => `${operation.method} ${operation.path} ${operation.operationId}`)
    .sort();
  if (JSON.stringify(manifestKeys) !== JSON.stringify(openapiKeys)) {
    throw new Error(`${family.routeManifest} routes do not match OpenAPI operations`);
  }
}

function validateOpenapi(family, openapi) {
  if (openapi.openapi !== "3.1.2") {
    throw new Error(`${family.authorityName} must use OpenAPI 3.1.2`);
  }
  if (openapi.info?.["x-sdkwork-api-authority"] !== family.authorityName) {
    throw new Error(`${family.authorityName} authority metadata mismatch`);
  }
  const operations = collectOperations(openapi);
  if (operations.length === 0) {
    throw new Error(`${family.authorityName} must declare operations`);
  }
  for (const operation of operations) {
    if (!operation.path.startsWith(family.apiPrefix)) {
      throw new Error(`${operation.path} must start with ${family.apiPrefix}`);
    }
  }
  for (const schemaName of ["SdkWorkApiResponse", "ProblemDetail", "PageInfo"]) {
    if (!openapi.components?.schemas?.[schemaName]) {
      throw new Error(`${family.authorityName} must expose ${schemaName}`);
    }
  }
  validateRouteManifest(family, operations);
  return operations;
}

function syncFamily(family) {
  const sourceOpenapiPath = resolveRoot(family.sourceOpenapi);
  if (!existsSync(sourceOpenapiPath)) {
    throw new Error(`missing source OpenAPI: ${sourceOpenapiPath}`);
  }
  const openapi = readJson(sourceOpenapiPath);
  validateOpenapi(family, openapi);
  const familyRoot = path.join(workspaceRoot, "sdks", family.familyName);
  const authorityPath = path.join(familyRoot, "openapi", `${family.authorityName}.openapi.json`);
  const sdkgenPath = path.join(familyRoot, "openapi", `${family.authorityName}.sdkgen.json`);
  writeJson(authorityPath, openapi);
  writeJson(sdkgenPath, openapi);
  writeJson(path.join(familyRoot, "sdk-manifest.json"), {
    schemaVersion: 1,
    workspace: family.familyName,
    sdkOwner: "sdkwork-manager",
    apiAuthority: family.authorityName,
    sourceAuthoritySpec: `../../${family.sourceOpenapi}`,
    authoritySpec: `openapi/${family.authorityName}.openapi.json`,
    generationInputSpec: `openapi/${family.authorityName}.sdkgen.json`,
    derivedSpecs: {
      default: `openapi/${family.authorityName}.sdkgen.json`,
    },
    discoverySurface: {
      sdkTarget: family.sdkType,
      apiPrefix: family.apiPrefix,
      generatedProtocols: ["http-openapi"],
      manualTransports: [],
    },
    languages: [
      {
        language: "typescript",
        workspace: `${family.familyName}-typescript`,
        generationState: "declared",
        releaseState: "not_published",
        generatedPath: `${family.familyName}-typescript/generated/server-openapi`,
        name: `@sdkwork/${family.familyName}`,
        version: "0.1.0",
      },
    ],
    sdkDependencies: family.sdkDependencies,
  });
  return { familyRoot, sdkgenPath };
}

function runSdkgen(family, synced, baseUrl) {
  if (!existsSync(GENERATOR_BIN)) {
    throw new Error(`standard SDK generator not found: ${GENERATOR_BIN}`);
  }
  const outputPath = path.join(
    synced.familyRoot,
    `${family.familyName}-typescript`,
    "generated",
    "server-openapi",
  );
  const result = spawnSync(
    "node",
    [
      GENERATOR_BIN,
      "generate",
      "--input",
      synced.sdkgenPath,
      "--output",
      outputPath,
      "--name",
      family.familyName,
      "--type",
      family.sdkType,
      "--language",
      "typescript",
      "--base-url",
      baseUrl || family.defaultBaseUrl,
      "--api-prefix",
      family.apiPrefix,
      "--fixed-sdk-version",
      "0.1.0",
      "--sdk-root",
      synced.familyRoot,
      "--sdk-name",
      family.familyName,
      "--package-name",
      `${family.familyName}-generated-typescript`,
      "--standard-profile",
      STANDARD_PROFILE,
    ],
    { cwd: synced.familyRoot, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`sdkgen failed for ${family.familyName}`);
  }
}

const checkMode = process.argv.includes("--check");
const familyArgIndex = process.argv.indexOf("--family");
const selectedFamily = familyArgIndex >= 0 ? process.argv[familyArgIndex + 1] : null;
const targets = selectedFamily
  ? families.filter((family) => family.familyName === selectedFamily)
  : families;

if (targets.length === 0) {
  fail(`unknown family: ${selectedFamily}`);
}

try {
  for (const family of targets) {
    const synced = syncFamily(family);
    if (!checkMode) {
      runSdkgen(family, synced);
    }
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

process.stdout.write(`[manager_sdk_generate] ${checkMode ? "check passed" : "generation completed"}\n`);
