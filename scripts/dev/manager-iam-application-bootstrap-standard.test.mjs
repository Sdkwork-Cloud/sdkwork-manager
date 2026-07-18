import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
  assert.match(devRunner, /sdkwork-manager-standalone-gateway/);
  assert.match(devRunner, /manager-server/);
  assert.match(devRunner, /sdkwork\.deployment\.config\.json/);
  assert.match(devRunner, /defaultProfile/);
  assert.match(devRunner, /StringComparer\]::OrdinalIgnoreCase\.Equals/);
  assert.match(devRunner, /Stop-Process -Id \$_\.Id -Force/);
  assert.ok(
    devRunner.indexOf("stopExistingGateway(executable)")
      < devRunner.indexOf("buildGateway();"),
    "the Windows gateway process must be stopped before Cargo rebuilds it",
  );
});

test("Manager manifests use the PC runtime app id required by IAM login", () => {
  for (const manifestPath of [
    "sdkwork.app.config.json",
    "apps/sdkwork-manager-pc/sdkwork.app.config.json",
  ]) {
    const manifest = JSON.parse(readFileSync(path.join(root, manifestPath), "utf8"));
    assert.equal(manifest.backend.appId, "sdkwork-manager-pc");
    assert.ok(manifest.backend.accessTokenPermissionScope.length > 0);
  }
});
