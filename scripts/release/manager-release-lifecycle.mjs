import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status ?? 1}`);
  }
}

function runPnpm(script) {
  if (process.platform === "win32") {
    run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "pnpm.cmd", script]);
    return;
  }
  run("pnpm", [script]);
}

function validateCurrentTarget() {
  if (process.env.SDKWORK_PACKAGE_PROFILE === "browser") {
    runPnpm("_sdkwork:release:validate:cloud");
    return;
  }
  if (process.env.SDKWORK_PACKAGE_PROFILE === "server") {
    runPnpm("_sdkwork:release:validate:standalone");
    return;
  }
  throw new Error(`Unsupported Manager release target: ${process.env.SDKWORK_PACKAGE_TARGET_ID ?? "unknown"}`);
}

export function runManagerReleasePhase(phase) {
  if (phase === "package") {
    if (process.env.SDKWORK_PACKAGE_PROFILE === "browser") {
      runPnpm("_sdkwork:release:package:cloud");
      return;
    }
    if (process.env.SDKWORK_PACKAGE_PROFILE === "server") {
      run("cargo", [
        "build",
        "--release",
        "-p",
        "sdkwork-api-manager-standalone-gateway",
        "--bin",
        "manager-server",
      ]);
      runPnpm("build");
      runPnpm("_sdkwork:release:package:standalone");
      runPnpm("_sdkwork:release:validate:standalone");
      return;
    }
    throw new Error(`Unsupported Manager package target: ${process.env.SDKWORK_PACKAGE_TARGET_ID ?? "unknown"}`);
  }
  if (phase === "sbom" || phase === "validate") {
    validateCurrentTarget();
    return;
  }
  throw new Error(`Unsupported Manager release phase: ${phase}`);
}
