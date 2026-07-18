#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = path.join(workspaceRoot, "apps", "sdkwork-manager-pc");
const result = spawnSync(
  process.env.CARGO ?? "cargo",
  ["run", "-p", "sdkwork-manager-standalone-gateway", "--bin", "manager-server"],
  {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      SDKWORK_MANAGER_APP_ROOT: appRoot,
      SDKWORK_MANAGER_BOOTSTRAP_ONLY: "true",
      SDKWORK_MANAGER_ENVIRONMENT: process.env.SDKWORK_MANAGER_ENVIRONMENT ?? "development",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.error) {
  console.error(`Manager IAM bootstrap failed to start: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
