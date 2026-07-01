#!/usr/bin/env node
/**
 * One-time portal → manager rename after copying sdkwork-portal skeleton.
 * Run from sdkwork-manager root: node tools/bootstrap_from_portal_rename.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DIR_RENAMES = [
  ["apps/sdkwork-portal-pc", "apps/sdkwork-manager-pc"],
  ["apps/sdkwork-portal-common", "apps/sdkwork-manager-common"],
  ["apis/app-api/portal", "apis/app-api/manager"],
  ["apis/backend-api/portal", "apis/backend-api/manager"],
  ["crates/sdkwork-portal-gateway-assembly", "crates/sdkwork-manager-gateway-assembly"],
  ["crates/sdkwork-routes-portal-common", "crates/sdkwork-routes-manager-common"],
  ["crates/sdkwork-platform-portal-service", "crates/sdkwork-platform-manager-service"],
  ["crates/sdkwork-platform-portal-repository-sqlx", "crates/sdkwork-platform-manager-repository-sqlx"],
  ["crates/sdkwork-routes-portal-app-api", "crates/sdkwork-routes-manager-app-api"],
  ["crates/sdkwork-routes-portal-backend-api", "crates/sdkwork-routes-manager-backend-api"],
  ["crates/sdkwork-portal-database-host", "crates/sdkwork-manager-database-host"],
  ["crates/sdkwork-portal-service-host", "crates/sdkwork-manager-service-host"],
  ["crates/sdkwork-portal-standalone-gateway", "crates/sdkwork-manager-standalone-gateway"],
  ["sdks/sdkwork-portal-app-sdk", "sdks/sdkwork-manager-app-sdk"],
  ["sdks/sdkwork-portal-backend-sdk", "sdks/sdkwork-manager-backend-sdk"],
  ["sdks/_route-manifests/app-api/sdkwork-routes-portal-app-api.route-manifest.json", "sdks/_route-manifests/app-api/sdkwork-routes-manager-app-api.route-manifest.json"],
  ["sdks/_route-manifests/backend-api/sdkwork-routes-portal-backend-api.route-manifest.json", "sdks/_route-manifests/backend-api/sdkwork-routes-manager-backend-api.route-manifest.json"],
  ["packages/sdkwork-portal-pc-core", "packages/sdkwork-manager-pc-core"],
  ["packages/sdkwork-portal-pc-shell", "packages/sdkwork-manager-pc-shell"],
  ["packages/sdkwork-portal-contracts", "packages/sdkwork-manager-contracts"],
  ["packages/sdkwork-portal-service", "packages/sdkwork-manager-service"],
  ["tools/scaffold_portal_workspace.mjs", "tools/scaffold_manager_workspace.mjs"],
  ["tools/portal_openapi_export.mjs", "tools/manager_openapi_export.mjs"],
  ["tools/portal_sdk_generate.mjs", "tools/manager_sdk_generate.mjs"],
  ["tools/portal_route_manifest_export.mjs", "tools/manager_route_manifest_export.mjs"],
  ["configs/sdkwork-api-cloud-gateway.portal.development.toml", "configs/sdkwork-api-cloud-gateway.manager.development.toml"],
  ["configs/sdkwork-api-cloud-gateway.portal.production.toml", "configs/sdkwork-api-cloud-gateway.manager.production.toml"],
  ["database/ddl/baseline/postgres/0001_portal_baseline.sql", "database/ddl/baseline/postgres/0001_manager_baseline.sql"],
  ["database/ddl/baseline/sqlite/0001_portal_baseline.sql", "database/ddl/baseline/sqlite/0001_manager_baseline.sql"],
  ["apis/app-api/manager/portal-app-api.openapi.json", "apis/app-api/manager/manager-app-api.openapi.json"],
  ["apis/backend-api/manager/portal-backend-api.openapi.json", "apis/backend-api/manager/manager-backend-api.openapi.json"],
];

const FILE_RENAMES = [
  ["apps/sdkwork-manager-pc/packages/sdkwork-portal-pc-core", "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-core"],
  ["apps/sdkwork-manager-pc/packages/sdkwork-portal-pc-shell", "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-shell"],
  ["apps/sdkwork-manager-common/packages/sdkwork-portal-contracts", "apps/sdkwork-manager-common/packages/sdkwork-manager-contracts"],
  ["apps/sdkwork-manager-common/packages/sdkwork-portal-service", "apps/sdkwork-manager-common/packages/sdkwork-manager-service"],
];

const TEXT_REPLACEMENTS = [
  ["sdkwork-portal-pc", "sdkwork-manager-pc"],
  ["sdkwork-portal-common", "sdkwork-manager-common"],
  ["sdkwork-portal-app-sdk", "sdkwork-manager-app-sdk"],
  ["sdkwork-portal-backend-sdk", "sdkwork-manager-backend-sdk"],
  ["sdkwork-portal-standalone-gateway", "sdkwork-manager-standalone-gateway"],
  ["sdkwork-portal-gateway-assembly", "sdkwork-manager-gateway-assembly"],
  ["sdkwork-portal-database-host", "sdkwork-manager-database-host"],
  ["sdkwork-portal-service-host", "sdkwork-manager-service-host"],
  ["sdkwork-platform-portal-repository-sqlx", "sdkwork-platform-manager-repository-sqlx"],
  ["sdkwork-platform-portal-service", "sdkwork-platform-manager-service"],
  ["sdkwork-routes-portal-backend-api", "sdkwork-routes-manager-backend-api"],
  ["sdkwork-routes-portal-app-api", "sdkwork-routes-manager-app-api"],
  ["sdkwork-routes-portal-common", "sdkwork-routes-manager-common"],
  ["sdkwork-portal-pc-core", "sdkwork-manager-pc-core"],
  ["sdkwork-portal-pc-shell", "sdkwork-manager-pc-shell"],
  ["sdkwork-portal-contracts", "sdkwork-manager-contracts"],
  ["sdkwork-portal-service", "sdkwork-manager-service"],
  ["sdkwork_portal_gateway_assembly", "sdkwork_manager_gateway_assembly"],
  ["sdkwork_portal_service_host", "sdkwork_manager_service_host"],
  ["sdkwork_portal_database_host", "sdkwork_manager_database_host"],
  ["sdkwork_platform_portal_service", "sdkwork_platform_manager_service"],
  ["sdkwork_platform_portal_repository_sqlx", "sdkwork_platform_manager_repository_sqlx"],
  ["sdkwork_routes_portal_common", "sdkwork_routes_manager_common"],
  ["sdkwork_routes_portal_app_api", "sdkwork_routes_manager_app_api"],
  ["sdkwork_routes_portal_backend_api", "sdkwork_routes_manager_backend_api"],
  ["PortalServiceHost", "ManagerServiceHost"],
  ["PortalService", "ManagerService"],
  ["PortalPreference", "ManagerPreference"],
  ["portal_preference", "manager_preference"],
  ["platform_portal_preference", "platform_manager_preference"],
  ["portal-server", "manager-server"],
  ["portal_server", "manager_server"],
  ["PORTAL_API_BIND", "MANAGER_API_BIND"],
  ["SDKWORK_PORTAL_", "SDKWORK_MANAGER_"],
  ["/app/v3/api/portal", "/app/v3/api/manager"],
  ["/backend/v3/api/portal", "/backend/v3/api/manager"],
  ["portal-app-api", "manager-app-api"],
  ["portal-backend-api", "manager-backend-api"],
  ["portal.sdkwork.com", "manager.sdkwork.com"],
  ["@sdkwork/portal-pc-app", "@sdkwork/manager-pc-app"],
  ["@sdkwork/portal-pc-core", "@sdkwork/manager-pc-core"],
  ["@sdkwork/portal-pc-shell", "@sdkwork/manager-pc-shell"],
  ["@sdkwork/portal-contracts", "@sdkwork/manager-contracts"],
  ["@sdkwork/portal-service", "@sdkwork/manager-service"],
  ["@sdkwork/sdkwork-portal-app-sdk", "@sdkwork/sdkwork-manager-app-sdk"],
  ["@sdkwork/sdkwork-portal-backend-sdk", "@sdkwork/sdkwork-manager-backend-sdk"],
  ["sdkwork-portal-app-api", "sdkwork-manager-app-api"],
  ["sdkwork-portal-backend-api", "sdkwork-manager-backend-api"],
  ["sdkwork-portal", "sdkwork-manager"],
  ["portal_openapi_export", "manager_openapi_export"],
  ["portal_sdk_generate", "manager_sdk_generate"],
  ["portal_route_manifest_export", "manager_route_manifest_export"],
  ["scaffold_portal_workspace", "scaffold_manager_workspace"],
  ["0001_portal_baseline", "0001_manager_baseline"],
  ['"moduleId": "portal"', '"moduleId": "manager"'],
  ['"serviceCode": "PORTAL"', '"serviceCode": "MANAGER"'],
  ["18091", "18092"],
  ["portal-server", "manager-server"],
  ["Portal API", "Manager API"],
  ["platform portal", "platform manager"],
  ["Platform Portal", "Platform Manager"],
  ["SDKWork Portal", "SDKWork Manager"],
  ["portal capability", "manager capability"],
  ["capability: `portal`", "capability: `manager`"],
  ["capability portal", "capability manager"],
  ['"capability": "portal"', '"capability": "manager"'],
  ["portal preference", "manager preference"],
  ["bind portal", "bind manager"],
  ["serve portal", "serve manager"],
  ["Starting SDKWork Portal", "Starting SDKWork Manager"],
];

const SKIP_DIRS = new Set(["node_modules", "target", ".git"]);
const SKIP_FILES = new Set(["bootstrap_from_portal_rename.mjs", "Cargo.lock", "pnpm-lock.yaml"]);

function renamePath(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  console.log(`renamed: ${fromRel} -> ${toRel}`);
}

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  }
}

// Phase 1: directory renames (deepest first by sorting path length desc)
for (const [from, to] of [...DIR_RENAMES, ...FILE_RENAMES].sort((a, b) => b[0].length - a[0].length)) {
  renamePath(from, to);
}

// Phase 2: text replacements in files
const textExtensions = new Set([
  ".rs", ".toml", ".json", ".yaml", ".yml", ".md", ".mjs", ".ts", ".tsx", ".css", ".html", ".sql", ".env", ".txt", ".gitkeep",
]);

walk(root, (filePath) => {
  const rel = path.relative(root, filePath);
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return;
  const ext = path.extname(filePath);
  if (!textExtensions.has(ext) && base !== "Cargo.toml" && !base.endsWith(".openapi.json")) return;
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;
  for (const [from, to] of TEXT_REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`updated: ${rel}`);
  }
});

console.log("[bootstrap_from_portal_rename] complete");
