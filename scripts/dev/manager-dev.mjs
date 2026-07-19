#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { mergeRepoDevBootstrapAccessTokenEnv } from "../../../sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs";
import { resolveManagerRuntimeEnv } from "./manager-profile-env.mjs";
import { refreshManagerWslPostgresPortProxy } from "./manager-wsl-postgres-portproxy.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = path.join(workspaceRoot, "apps", "sdkwork-manager-pc");
function buildGateway() {
  const result = spawnSync(
    process.env.CARGO ?? "cargo",
    ["build", "-p", "sdkwork-manager-standalone-gateway", "--bin", "manager-server"],
    { cwd: workspaceRoot, env: process.env, stdio: "inherit", windowsHide: true },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function stopExistingGateway(executable) {
  if (process.platform !== "win32" || !existsSync(executable)) {
    return;
  }

  const script = `
    $targetPath = [System.IO.Path]::GetFullPath($env:SDKWORK_MANAGER_GATEWAY_EXECUTABLE)
    Get-Process -Name 'manager-server' -ErrorAction SilentlyContinue | ForEach-Object {
      try { $processPath = $_.MainModule.FileName } catch { $processPath = $null }
      if ($processPath -and [System.StringComparer]::OrdinalIgnoreCase.Equals(
        [System.IO.Path]::GetFullPath($processPath),
        $targetPath
      )) {
        Stop-Process -Id $_.Id -Force -ErrorAction Stop
        Wait-Process -Id $_.Id -Timeout 10 -ErrorAction SilentlyContinue
      }
    }
    exit 0
  `;
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    {
      cwd: workspaceRoot,
      env: { ...process.env, SDKWORK_MANAGER_GATEWAY_EXECUTABLE: executable },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Failed to stop the existing Manager gateway (exit ${result.status ?? 1})`);
  }
}

async function waitForGateway(origin, gateway) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (gateway.exitCode !== null) {
      throw new Error(`Manager standalone gateway exited with code ${gateway.exitCode}`);
    }
    try {
      const response = await fetch(new URL("/healthz", origin), {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.status < 500) {
        return;
      }
    } catch {
      // The gateway may still be bootstrapping IAM and database state.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Manager standalone gateway did not become ready at ${origin}`);
}

function stopChild(child) {
  if (child && child.exitCode === null && !child.killed) {
    child.kill();
  }
}

async function main() {
  const profileEnv = resolveManagerRuntimeEnv();
  const runtimeEnv = mergeRepoDevBootstrapAccessTokenEnv({
    env: profileEnv,
    manifestPath: "apps/sdkwork-manager-pc/sdkwork.app.config.json",
    repoRoot: workspaceRoot,
  });
  refreshManagerWslPostgresPortProxy(runtimeEnv);

  const executable = path.join(
    workspaceRoot,
    "target",
    "debug",
    process.platform === "win32" ? "manager-server.exe" : "manager-server",
  );
  stopExistingGateway(executable);
  buildGateway();
  const gateway = spawn(executable, [], {
    cwd: workspaceRoot,
    env: runtimeEnv,
    stdio: "inherit",
    windowsHide: true,
  });

  let vite;
  const cleanup = () => {
    stopChild(vite);
    stopChild(gateway);
  };
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);
  process.once("exit", cleanup);

  await waitForGateway(
    runtimeEnv.SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL ?? "http://127.0.0.1:18092",
    gateway,
  );

  const require = createRequire(path.join(appRoot, "package.json"));
  const vitePackageJson = require.resolve("vite/package.json");
  const viteExecutable = path.join(path.dirname(vitePackageJson), "bin", "vite.js");
  vite = spawn(process.execPath, [viteExecutable, "--host", "127.0.0.1", "--port", "5190"], {
    cwd: appRoot,
    env: runtimeEnv,
    stdio: "inherit",
    windowsHide: true,
  });

  vite.once("exit", (code) => {
    stopChild(gateway);
    process.exit(code ?? 0);
  });
  gateway.once("exit", (code) => {
    stopChild(vite);
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
