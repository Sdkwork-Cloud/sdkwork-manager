#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveManagerRuntimeEnv } from "./manager-profile-env.mjs";
import { refreshManagerWslPostgresPortProxy } from "./manager-wsl-postgres-portproxy.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimeEnv = resolveManagerRuntimeEnv();
refreshManagerWslPostgresPortProxy(runtimeEnv);

const result = spawnSync(
  process.env.CARGO ?? "cargo",
  ["run", "-p", "sdkwork-api-manager-standalone-gateway", "--bin", "manager-server"],
  {
    cwd: workspaceRoot,
    env: runtimeEnv,
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
