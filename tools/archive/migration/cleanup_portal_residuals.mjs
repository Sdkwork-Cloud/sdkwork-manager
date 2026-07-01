#!/usr/bin/env node
/**
 * Remove residual portal naming after manager bootstrap.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", "target", ".git", ".runtime"]);
const SKIP_FILES = new Set(["cleanup_portal_residuals.mjs", "bootstrap_from_portal_rename.mjs"]);

const REPLACEMENTS = [
  ["apis/app-api/portal/", "apis/app-api/manager/"],
  ["apis/backend-api/portal/", "apis/backend-api/manager/"],
  ["portal.preferences.admin.list", "manager.preferences.admin.list"],
  ["portal.preferences.retrieve", "manager.preferences.retrieve"],
  ["portal.preferences.update", "manager.preferences.update"],
  ["build_portal_backend_router_with_framework", "build_manager_backend_router_with_framework"],
  ["build_portal_backend_router", "build_manager_backend_router"],
  ["build_portal_app_router_with_framework", "build_manager_app_router_with_framework"],
  ["build_portal_app_router", "build_manager_app_router"],
  ["portal_backend_api_public_path_prefixes", "manager_backend_api_public_path_prefixes"],
  ["portal_app_api_public_path_prefixes", "manager_app_api_public_path_prefixes"],
  ["bootstrap_portal_database_from_env", "bootstrap_manager_database_from_env"],
  ["bootstrap_portal_database", "bootstrap_manager_database"],
  ["PortalDatabaseHost", "ManagerDatabaseHost"],
  ["SqlxPortalRepository", "SqlxManagerRepository"],
  [".portal_service()", ".manager_service()"],
  ["portal_service:", "manager_service:"],
  ["pub fn portal_service", "pub fn manager_service"],
  ["portal theme", "manager theme"],
  ["portal repository", "manager repository"],
  ["portal service host", "manager service host"],
  ["portal database", "manager database"],
  ["portal-test", "manager-test"],
  ["trace-portal-test", "trace-manager-test"],
  ['"tags": ["portal"]', '"tags": ["manager"]'],
  ['"portal"', '"manager"'],
  ["sdkwork-portal-app-api", "sdkwork-manager-app-api"],
  ["sdkwork-portal-backend-api", "sdkwork-manager-backend-api"],
  ["sdkwork-api-cloud-gateway.portal.", "sdkwork-api-cloud-gateway.manager."],
  ["sdkwork-api-cloud-gateway.portal.", "sdkwork-api-cloud-gateway.manager."],
  ["Portal preferences", "Manager preferences"],
  ["unified PC portal shell", "unified PC manager admin shell"],
  ["com.sdkwork.portal", "com.sdkwork.manager"],
  ["in portal-service", "in manager-service"],
  ["portal-service", "manager-service"],
  ["assert.equal(spec.component.capability, \"portal\")", "assert.equal(spec.component.capability, \"manager\")"],
  ["apis/app-api/portal/examples", "apis/app-api/manager/examples"],
  ["apis/backend-api/portal/examples", "apis/backend-api/manager/examples"],
  ["apis/app-api/portal/changelogs", "apis/app-api/manager/changelogs"],
  ["apis/backend-api/portal/changelogs", "apis/backend-api/manager/changelogs"],
  ["portal-platform", "manager-platform"],
  ["module_id: portal", "module_id: manager"],
];

const textExtensions = new Set([
  ".rs", ".toml", ".json", ".yaml", ".yml", ".md", ".mjs", ".ts", ".tsx", ".css", ".html", ".sql", ".env",
]);

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

walk(root, (filePath) => {
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return;
  const ext = path.extname(filePath);
  if (!textExtensions.has(ext) && !base.endsWith(".openapi.json")) return;
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`fixed: ${path.relative(root, filePath)}`);
  }
});

// Remove stale generated SDK openapi copies with old names
for (const stale of [
  "sdks/sdkwork-manager-app-sdk/openapi/sdkwork-portal-app-api.openapi.json",
  "sdks/sdkwork-manager-app-sdk/openapi/sdkwork-portal-app-api.sdkgen.json",
  "sdks/sdkwork-manager-backend-sdk/openapi/sdkwork-portal-backend-api.openapi.json",
  "sdks/sdkwork-manager-backend-sdk/openapi/sdkwork-portal-backend-api.sdkgen.json",
]) {
  const full = path.join(root, stale);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    console.log(`removed stale: ${stale}`);
  }
}

console.log("[cleanup_portal_residuals] complete");
