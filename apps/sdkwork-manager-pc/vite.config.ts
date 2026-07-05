import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { buildManagerViteDevProxy } from "../sdkwork-manager-common/packages/sdkwork-manager-client-core/src/dev/viteDevProxy";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appRoot, "../..");
const workspaceRoot = path.resolve(repoRoot, "..");

function repoPath(...segments: string[]): string {
  return path.resolve(repoRoot, ...segments);
}

function workspacePath(...segments: string[]): string {
  return path.resolve(workspaceRoot, ...segments);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, "");
  return {
    define: {
      "process.env.SDKWORK_ACCESS_TOKEN": JSON.stringify(env.SDKWORK_ACCESS_TOKEN ?? ""),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@sdkwork/utils": workspacePath(
          "sdkwork-utils/packages/sdkwork-utils-typescript/src/index.ts",
        ),
        "@sdkwork/sdk-common": workspacePath(
          "sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts",
        ),
        "@sdkwork/iam-app-sdk": workspacePath(
          "sdkwork-iam/sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/iam-backend-sdk": workspacePath(
          "sdkwork-iam/sdks/sdkwork-iam-backend-sdk/sdkwork-iam-backend-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/auth-pc-react": workspacePath(
          "sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src/index.ts",
        ),
        "@sdkwork/auth-runtime-pc-react": workspacePath(
          "sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react/src/index.ts",
        ),
        "@sdkwork/iam-contracts": workspacePath(
          "sdkwork-iam/apps/sdkwork-iam-common/packages/sdkwork-iam-contracts/src/index.ts",
        ),
        "@sdkwork/iam-credential-entry": workspacePath(
          "sdkwork-iam/apps/sdkwork-iam-common/packages/sdkwork-iam-credential-entry/src/index.ts",
        ),
        "@sdkwork/manager-client-core": repoPath(
          "apps/sdkwork-manager-common/packages/sdkwork-manager-client-core/src/index.ts",
        ),
        "@sdkwork/manager-contracts": repoPath(
          "apps/sdkwork-manager-common/packages/sdkwork-manager-contracts/src/index.ts",
        ),
        "@sdkwork/manager-service": repoPath(
          "apps/sdkwork-manager-common/packages/sdkwork-manager-service/src/index.ts",
        ),
        "@sdkwork/manager-pc-core": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-core/src/index.ts",
        ),
        "@sdkwork/manager-pc-shell": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-shell/src/index.tsx",
        ),
        "@sdkwork/manager-app-sdk": repoPath(
          "sdks/sdkwork-manager-app-sdk/sdkwork-manager-app-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/manager-backend-sdk": repoPath(
          "sdks/sdkwork-manager-backend-sdk/sdkwork-manager-backend-sdk-typescript/src/index.ts",
        ),
      },
    },
    server: {
      port: 5190,
      strictPort: true,
      host: "127.0.0.1",
      proxy: buildManagerViteDevProxy(env),
    },
  };
});
