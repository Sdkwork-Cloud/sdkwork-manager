#!/usr/bin/env node
/**
 * Bootstrap sdkwork-manager workspace aligned with sdkwork-specs.
 * Run: node tools/scaffold_manager_workspace.mjs
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(relativePath, content) {
  const fullPath = path.join(root, relativePath);
  if (await exists(fullPath)) {
    return false;
  }
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, "utf8");
  return true;
}

const placeholderDirs = [
  "apis/README.md",
  "apis/app-api/manager/examples/.gitkeep",
  "apis/app-api/manager/changelogs/.gitkeep",
  "apis/backend-api/manager/examples/.gitkeep",
  "apis/backend-api/manager/changelogs/.gitkeep",
  "apps/README.md",
  "crates/README.md",
  "sdks/README.md",
  "jobs/README.md",
  "tools/README.md",
  "plugins/README.md",
  "examples/README.md",
  "configs/README.md",
  "deployments/README.md",
  "scripts/README.md",
  "docs/README.md",
  "tests/README.md",
  ".sdkwork/README.md",
  ".sdkwork/skills/README.md",
  ".sdkwork/plugins/README.md",
];

for (const dir of placeholderDirs) {
  const content = dir.endsWith(".gitkeep")
    ? ""
    : `# ${path.basename(path.dirname(dir)) || path.basename(dir, ".md")}\n\nSee \`../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md\`.\n`;
  await writeIfMissing(dir, content);
}

for (const shim of ["CLAUDE.md", "GEMINI.md", "CODEX.md"]) {
  await writeIfMissing(
    shim,
    `# ${shim.replace(".md", "")} Compatibility Shim

Read \`AGENTS.md\` in this directory. Do not duplicate SDKWork rules here.
`,
  );
}

console.log("[scaffold_manager_workspace] placeholder directories written");
