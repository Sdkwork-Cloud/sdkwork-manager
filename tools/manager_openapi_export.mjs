#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const authorities = [
  "apis/app-api/manager/manager-app-api.openapi.json",
  "apis/backend-api/manager/manager-backend-api.openapi.json",
];

function fail(message) {
  process.stderr.write(`[manager_openapi_export] ${message}\n`);
  process.exit(1);
}

for (const relativePath of authorities) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing OpenAPI authority: ${relativePath}`);
  }
  const openapi = JSON.parse(readFileSync(absolutePath, "utf8"));
  if (openapi.openapi !== "3.1.2") {
    fail(`${relativePath} must use OpenAPI 3.1.2`);
  }
  for (const schemaName of ["SdkWorkApiResponse", "ProblemDetail"]) {
    if (!openapi.components?.schemas?.[schemaName]) {
      fail(`${relativePath} must declare ${schemaName}`);
    }
  }
}

process.stdout.write("[manager_openapi_export] check ok\n");
