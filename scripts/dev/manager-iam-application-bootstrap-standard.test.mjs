import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  resolveManagerProfileEnv,
  resolveManagerRuntimeEnv,
} from "./manager-profile-env.mjs";
import { parseClientBind } from "./manager-dev.mjs";
import { refreshManagerWslPostgresPortProxy } from "./manager-wsl-postgres-portproxy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const managerIamMenuPermissions = [
  "iam.users.read",
  "iam.tenants.read",
  "iam.organizations.read",
  "iam.roles.read",
  "iam.permissions.read",
  "iam.oauth.read",
  "iam.account_binding_policy.read",
  "iam.audit_events.read",
];

test("Manager standalone startup provisions its manifest-backed IAM runtime before routes", () => {
  const cargo = readFileSync(
    path.join(root, "crates/sdkwork-api-manager-standalone-gateway/Cargo.toml"),
    "utf8",
  );
  const main = readFileSync(
    path.join(root, "crates/sdkwork-api-manager-standalone-gateway/src/main.rs"),
    "utf8",
  );
  const appPackage = JSON.parse(readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/package.json"),
    "utf8",
  ));
  const devRunner = readFileSync(
    path.join(root, "scripts/dev/manager-dev.mjs"),
    "utf8",
  );
  const startRunner = readFileSync(
    path.join(root, "scripts/dev/manager-start.mjs"),
    "utf8",
  );
  const bootstrap = readFileSync(
    path.join(
      root,
      "crates/sdkwork-api-manager-standalone-gateway/src/iam_application_bootstrap.rs",
    ),
    "utf8",
  );

  assert.match(cargo, /sdkwork_iam_embedded_application_bootstrap\.workspace = true/);
  assert.match(cargo, /sdkwork_iam_database_host\.workspace = true/);
  const bootstrapCallIndex = main.indexOf(
    "iam_application_bootstrap::ensure_manager_iam_application_bootstrap",
  );
  const routeAssemblyIndex = main.indexOf("let assembly = assemble_api_router");
  assert.ok(bootstrapCallIndex >= 0, "startup must invoke the Manager IAM bootstrap");
  assert.ok(routeAssemblyIndex >= 0, "startup must assemble the Manager router");
  assert.ok(
    bootstrapCallIndex < routeAssemblyIndex,
    "IAM application provisioning must finish before Manager routes are assembled",
  );
  assert.match(bootstrap, /bootstrap_iam_database_from_env/);
  assert.match(bootstrap, /ensure_tenant_application_from_app_root/);
  assert.match(bootstrap, /SDKWORK_MANAGER_APP_ROOT/);
  assert.doesNotMatch(bootstrap, /fetch\(|axios\.|INSERT\s+INTO/i);
  assert.match(appPackage.scripts.dev, /manager-dev\.mjs/);
  assert.match(appPackage.scripts["install:bootstrap"], /manager-bootstrap\.mjs/);
  const rootPackage = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const topology = JSON.parse(readFileSync(
    path.join(root, "specs/topology.spec.json"),
    "utf8",
  ));
  const standaloneProcesses = topology.orchestration.profiles["standalone.development"].processes;
  assert.equal(rootPackage.scripts.start, "pnpm dev:standalone");
  assert.match(rootPackage.scripts["_sdkwork:gateway:standalone"], /manager-start\.mjs/);
  assert.match(rootPackage.scripts["_sdkwork:client:browser"], /sdkwork-manager-pc dev/);
  assert.ok(standaloneProcesses.some(
    (process) => process.role === "api-standalone-gateway"
      && process.script === "_sdkwork:gateway:standalone",
  ));
  assert.ok(standaloneProcesses.some(
    (process) => process.role === "client"
      && process.script === "_sdkwork:client:browser",
  ));
  assert.match(devRunner, /resolveManagerRuntimeEnv/);
  assert.match(startRunner, /resolveManagerRuntimeEnv/);
  assert.match(startRunner, /refreshManagerWslPostgresPortProxy/);
  assert.match(startRunner, /sdkwork-api-manager-standalone-gateway/);
  assert.match(devRunner, /@sdkwork\/app-topology\/network-access/);
  assert.match(devRunner, /application started successfully/);
  assert.doesNotMatch(devRunner, /sdkwork-api-manager-standalone-gateway/);
});

test("Manager standalone profile supplies the IAM and Manager CORS allowlists", () => {
  const profileEnv = resolveManagerProfileEnv({});

  assert.equal(profileEnv.SDKWORK_MANAGER_PROFILE_ID, "standalone.development");
  assert.equal(profileEnv.SDKWORK_ENVIRONMENT, "development");
  assert.equal(profileEnv.SDKWORK_MANAGER_APPLICATION_PUBLIC_INGRESS_BIND, "0.0.0.0:18092");
  assert.equal(profileEnv.SDKWORK_MANAGER_PC_DEV_BIND, "0.0.0.0:5190");
  assert.equal(profileEnv.SDKWORK_MANAGER_CORS_ALLOWED_ORIGINS, "http://127.0.0.1:5190");
  assert.equal(profileEnv.SDKWORK_CORS_ALLOWED_ORIGINS, "http://127.0.0.1:5190");
  assert.equal(profileEnv.SDKWORK_IAM_CORS_ALLOWED_ORIGINS, "http://127.0.0.1:5190");
  assert.equal(
    profileEnv.SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL,
    profileEnv.SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL,
  );
  assert.equal(
    profileEnv.VITE_SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL,
    profileEnv.VITE_SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL,
  );
  assert.equal(profileEnv.SDKWORK_DRIVE_DATABASE_URL, undefined);
  assert.equal(profileEnv.SDKWORK_DRIVE_DATABASE_MAX_CONNECTIONS, undefined);
  assert.equal(profileEnv.SDKWORK_DATABASE_TEMPORARY_ANY_POOL_EXCEPTION, "true");
  assert.equal(profileEnv.SDKWORK_MANAGER_WSL_POSTGRES_PORTPROXY_ENABLED, "true");
});

test("Manager runtime environment preserves process overrides", () => {
  const runtimeEnv = resolveManagerRuntimeEnv({
    SDKWORK_CLAW_DATABASE_HOST: "database.internal",
    SDKWORK_MANAGER_WSL_POSTGRES_PORTPROXY_ENABLED: "false",
  });

  assert.equal(runtimeEnv.SDKWORK_CLAW_DATABASE_HOST, "database.internal");
  assert.equal(runtimeEnv.SDKWORK_MANAGER_WSL_POSTGRES_PORTPROXY_ENABLED, "false");
});

test("Manager PC development bind is explicit and validated", () => {
  assert.deepEqual(parseClientBind("0.0.0.0:5190"), {
    host: "0.0.0.0",
    port: 5190,
  });
  assert.throws(
    () => parseClientBind("0.0.0.0:not-a-port"),
    /Invalid SDKWORK_MANAGER_PC_DEV_BIND/,
  );
});

test("WSL PostgreSQL proxy refresh is Windows-only and explicitly enabled", () => {
  let calls = 0;
  const run = () => {
    calls += 1;
    return { status: 0 };
  };

  assert.equal(refreshManagerWslPostgresPortProxy({}, { platform: "win32", run }), false);
  assert.equal(
    refreshManagerWslPostgresPortProxy(
      { SDKWORK_MANAGER_WSL_POSTGRES_PORTPROXY_ENABLED: "true" },
      { platform: "linux", run },
    ),
    false,
  );
  assert.equal(
    refreshManagerWslPostgresPortProxy(
      { SDKWORK_MANAGER_WSL_POSTGRES_PORTPROXY_ENABLED: "true" },
      { platform: "win32", run },
    ),
    true,
  );
  assert.equal(calls, 1);
});

test("Manager manifests use the PC runtime app id required by IAM login", () => {
  for (const manifestPath of [
    "sdkwork.app.config.json",
    "apps/sdkwork-manager-pc/sdkwork.app.config.json",
  ]) {
    const manifest = JSON.parse(readFileSync(path.join(root, manifestPath), "utf8"));
    assert.equal(manifest.backend.appId, "sdkwork-manager-pc");
    for (const permission of managerIamMenuPermissions) {
      assert.ok(
        manifest.backend.accessTokenPermissionScope.includes(permission),
        `${manifestPath} must request ${permission} for the registered IAM menu`,
      );
    }
  }
});
