import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "refresh-wsl-postgres-portproxy.ps1",
);

function isEnabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

export function refreshManagerWslPostgresPortProxy(
  environment,
  { platform = process.platform, run = spawnSync } = {},
) {
  if (
    platform !== "win32"
    || !isEnabled(environment.SDKWORK_MANAGER_WSL_POSTGRES_PORTPROXY_ENABLED)
  ) {
    return false;
  }

  const result = run(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
    ],
    {
      env: environment,
      stdio: "inherit",
      windowsHide: true,
    },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `Manager WSL PostgreSQL portproxy refresh failed (exit ${result.status ?? 1})`,
    );
  }
  return true;
}
