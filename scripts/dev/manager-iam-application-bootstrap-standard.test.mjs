import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  resolveManagerProfileEnv,
  resolveManagerRuntimeEnv,
} from "./manager-profile-env.mjs";
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
    path.join(root, "crates/sdkwork-manager-standalone-gateway/Cargo.toml"),
    "utf8",
  );
  const main = readFileSync(
    path.join(root, "crates/sdkwork-manager-standalone-gateway/src/main.rs"),
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
      "crates/sdkwork-manager-standalone-gateway/src/iam_application_bootstrap.rs",
    ),
    "utf8",
  );

  assert.match(cargo, /sdkwork_iam_embedded_application_bootstrap\.workspace = true/);
  assert.match(cargo, /sdkwork_iam_database_host\.workspace = true/);
  const bootstrapCallIndex = main.indexOf(
    "iam_application_bootstrap::ensure_manager_iam_application_bootstrap",
  );
  const routeAssemblyIndex = main.indexOf("let assembly = assemble_application_router");
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
  assert.match(appPackage.scripts["dev:bootstrap"], /manager-bootstrap\.mjs/);
  const rootPackage = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(rootPackage.scripts.start, /manager-start\.mjs/);
  assert.match(devRunner, /sdkwork-manager-standalone-gateway/);
  assert.match(devRunner, /manager-server/);
  assert.match(devRunner, /resolveManagerRuntimeEnv/);
  assert.match(startRunner, /resolveManagerRuntimeEnv/);
  assert.match(devRunner, /refreshManagerWslPostgresPortProxy/);
  assert.match(startRunner, /refreshManagerWslPostgresPortProxy/);
  assert.match(startRunner, /sdkwork-manager-standalone-gateway/);
  assert.match(devRunner, /StringComparer\]::OrdinalIgnoreCase\.Equals/);
  assert.match(devRunner, /Stop-Process -Id \$_\.Id -Force/);
  assert.ok(
    devRunner.indexOf("stopExistingGateway(executable)")
      < devRunner.indexOf("buildGateway();"),
    "the Windows gateway process must be stopped before Cargo rebuilds it",
  );
});

test("Manager standalone profile supplies the IAM and Manager CORS allowlists", () => {
  const profileEnv = resolveManagerProfileEnv({});

  assert.equal(profileEnv.SDKWORK_MANAGER_PROFILE_ID, "standalone.development");
  assert.equal(profileEnv.SDKWORK_ENVIRONMENT, "development");
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
