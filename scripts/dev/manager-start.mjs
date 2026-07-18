#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveManagerProfileEnv } from "./manager-profile-env.mjs";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const result = spawnSync(
  process.env.CARGO ?? "cargo",
  ["run", "-p", "sdkwork-manager-standalone-gateway", "--bin", "manager-server"],
  {
    cwd: workspaceRoot,
    env: { ...resolveManagerProfileEnv(), ...process.env },
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
