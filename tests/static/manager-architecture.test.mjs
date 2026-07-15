import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("workspace declares sdkwork-web-framework and sdkwork-database deps", () => {
  const cargo = readFileSync(path.join(root, "Cargo.toml"), "utf8");
  assert.match(cargo, /sdkwork-web-core/);
  assert.match(cargo, /sdkwork-web-axum/);
  assert.match(cargo, /sdkwork-database-config/);
  assert.match(cargo, /sdkwork-database-lifecycle/);
  assert.doesNotMatch(cargo, /sdkwork-discovery/);
});

test("tsconfig wires sdkwork utils", () => {
  const tsconfig = JSON.parse(readFileSync(path.join(root, "tsconfig.base.json"), "utf8"));
  assert.ok(tsconfig.compilerOptions.paths["@sdkwork/utils"]);
});

test("component spec declares platform manager capability", () => {
  const spec = JSON.parse(readFileSync(path.join(root, "specs/component.spec.json"), "utf8"));
  assert.equal(spec.component.domain, "platform");
  assert.equal(spec.component.capability, "manager");
});

test("package scripts follow PNPM_SCRIPT_SPEC minimum surface", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  for (const script of ["dev", "build", "test", "check", "verify", "clean"]) {
    assert.ok(pkg.scripts[script], `missing script: ${script}`);
  }
});

test("vite production aliases include sdk-common and composed manager SDK bundles", () => {
  const viteConfig = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/vite.config.ts"),
    "utf8",
  );
  assert.match(viteConfig, /@sdkwork\/sdk-common/);
  assert.match(viteConfig, /@sdkwork\/manager-app-sdk/);
  assert.doesNotMatch(viteConfig, /sdkwork-manager-app-sdk-generated-typescript/);
});

test("Manager Vite uses the IAM development credential-entry bootstrap only outside production", () => {
  const appPackage = JSON.parse(readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/package.json"),
    "utf8",
  ));
  const viteConfig = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/vite.config.ts"),
    "utf8",
  );

  assert.match(appPackage.scripts.dev, /run-pc-renderer-dev-with-bootstrap/);
  assert.match(appPackage.scripts.dev, /sdkwork\.app\.config\.json/);
  assert.match(viteConfig, /mode !== "development"/);
  assert.match(viteConfig, /__SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN__/);
  assert.match(viteConfig, /process\.env\.SDKWORK_ACCESS_TOKEN/);
  assert.match(viteConfig, /transformIndexHtml/);
  assert.match(viteConfig, /apply: "serve"/);
  assert.doesNotMatch(viteConfig, /globalThis\.process/);
  assert.doesNotMatch(viteConfig, /VITE_ACCESS_TOKEN/);
});

test("Manager delegates IAM application provisioning to the shared bootstrap framework", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

  assert.equal(pkg.devDependencies["@sdkwork/iam-application-bootstrap"], "workspace:*");
  assert.match(pkg.scripts["admin:bootstrap:app"], /sdkwork-iam\/scripts\/bootstrap\/bootstrap-app\.mjs/);
});

test("Manager gateway bundles the IAM app API alongside Manager routes", () => {
  for (const profile of ["development", "production"]) {
    const config = readFileSync(
      path.join(root, `configs/sdkwork-api-cloud-gateway.manager.${profile}.toml`),
      "utf8",
    );
    assert.match(config, /serviceId = "sdkwork-iam-app-api"/);
    assert.match(config, /apiPrefix = "\/app\/v3\/api"/);
    assert.match(config, /sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router/);
  }
});

test("verify pipeline includes production build and gateway validation", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.verify, /pnpm build/);
  assert.match(pkg.scripts.verify, /gateway:validate:cloud/);
});

test("launch readiness runbook documents IAM bootstrap via sdkwork-iam", () => {
  const runbook = readFileSync(path.join(root, "docs/runbooks/LAUNCH_READINESS.md"), "utf8");
  const docsIndex = readFileSync(path.join(root, "docs/INDEX.yaml"), "utf8");
  assert.match(runbook, /--appbase-root sdkwork-iam/);
  assert.match(runbook, /bootstrap-all-apps\.mjs --filter sdkwork-manager/);
  assert.match(docsIndex, /launchReadiness: docs\/runbooks\/LAUNCH_READINESS\.md/);
});

test("IAM login route renders one IAM surface inside the standard manager auth frame", () => {
  const authRoutes = readFileSync(
    path.join(
      root,
      "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-shell/src/auth/ManagerAuthRoutes.tsx",
    ),
    "utf8",
  );

  assert.match(authRoutes, /<SdkworkIamAuthRoutes/);
  assert.match(authRoutes, /<ManagerAuthShell>/);
  assert.match(authRoutes, /viewportMode="flow"/);
  assert.match(authRoutes, /authRuntime\.status !== "ready"/);
  assert.match(authRoutes, /manager-auth-routes !bg-transparent/);
});

test("manager IAM surface defines the complete branded auth token set", () => {
  const authStyles = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/src/index.css"),
    "utf8",
  );

  for (const token of [
    "--sdkwork-auth-primary-button-background-color",
    "--sdkwork-auth-action-button-text-color",
    "--sdkwork-auth-field-background-color",
    "--sdkwork-auth-tab-active-background-color",
    "--sdkwork-auth-tab-active-icon-color",
    "--sdkwork-auth-validation-message-color",
  ]) {
    assert.match(authStyles, new RegExp(token));
  }
});

test("Manager auth host keeps the ClawRouter PC geometry while using IAM-owned routes", () => {
  const authShell = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-shell/src/auth/ManagerAuthShell.tsx"),
    "utf8",
  );
  const authStyles = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/src/index.css"),
    "utf8",
  );

  assert.match(authShell, /sdkwork-manager-auth-host/);
  assert.match(authShell, /sdkwork-manager-auth-main/);
  assert.match(authShell, /sdkwork-manager-auth-active/);
  assert.match(authStyles, /height: 100dvh/);
  assert.match(authStyles, /position: fixed/);
  assert.match(authStyles, /overflow-y: auto/);
  assert.match(authStyles, /#e55039/);
  assert.match(authStyles, /\.sdkwork-manager-auth-main/);
});

test("Manager Tailwind source closure includes the IAM auth layout utilities", () => {
  const authStyles = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/src/index.css"),
    "utf8",
  );
  const cssRoot = path.join(root, "apps/sdkwork-manager-pc/src");
  const sourceRoots = [...authStyles.matchAll(/@source\s+["']([^"']+)["']\s*;/g)]
    .map((match) => match[1]);

  assert.ok(
    sourceRoots.includes("../../../../sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src"),
    "the host must scan the IAM auth component source tree",
  );
  for (const sourceRoot of sourceRoots) {
    assert.ok(
      existsSync(path.resolve(cssRoot, sourceRoot)),
      `Tailwind source root must resolve from the Manager shell: ${sourceRoot}`,
    );
  }
});

test("session-expired login modal is scoped to protected manager routes", () => {
  const appShell = readFileSync(
    path.join(root, "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-shell/src/index.tsx"),
    "utf8",
  );

  const protectedAreaStart = appShell.indexOf("function ProtectedAdminArea");
  const appStart = appShell.indexOf("export function ManagerPcApp");
  assert.ok(protectedAreaStart >= 0, "protected area must own the session auth provider");
  assert.ok(appStart > protectedAreaStart, "protected area must be declared before the app route tree");
  assert.match(
    appShell.slice(protectedAreaStart, appStart),
    /<SdkworkSessionAuthBrowserRoot[\s\S]*<RequireOperatorSession>/,
  );
  assert.doesNotMatch(
    appShell.slice(appStart),
    /<SdkworkSessionAuthBrowserRoot/,
  );
});
