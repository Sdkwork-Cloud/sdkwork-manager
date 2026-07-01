import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("database framework standard checker passes", () => {
  const checker = path.join(root, "../sdkwork-specs/tools/check-database-framework-standard.mjs");
  const result = spawnSync(process.execPath, [checker, "--root", root], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`database framework check failed with status ${result.status}`);
  }
});
