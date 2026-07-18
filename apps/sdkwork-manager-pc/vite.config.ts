import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appRoot, "../..");
const workspaceRoot = path.resolve(repoRoot, "..");
const managerNodeModulesRoot = path.resolve(repoRoot, "node_modules");
const i18nRuntimeNodeModulesRoot = path.resolve(
  workspaceRoot,
  "sdkwork-appbase/packages/pc-react/foundation/sdkwork-i18n-pc-react/node_modules",
);
const viteWorkspaceSourceRoots = [
  repoRoot,
  workspacePath("sdkwork-iam"),
  workspacePath("sdkwork-drive"),
  workspacePath("sdkwork-payment"),
  workspacePath("sdkwork-order"),
  workspacePath("sdkwork-promotion"),
  workspacePath("sdkwork-membership"),
  workspacePath("sdkwork-appbase"),
  workspacePath("sdkwork-ui"),
  workspacePath("sdkwork-sdk-commons"),
  workspacePath("sdkwork-utils"),
];

function repoPath(...segments: string[]): string {
  return path.resolve(repoRoot, ...segments);
}

function workspacePath(...segments: string[]): string {
  return path.resolve(workspaceRoot, ...segments);
}

function resolveManagerManualChunk(id: string): string | undefined {
  const normalizedId = id.replaceAll("\\", "/");
  if (
    normalizedId.includes("/node_modules/react/")
    || normalizedId.includes("/node_modules/react-dom/")
    || normalizedId.includes("/node_modules/react-router/")
    || normalizedId.includes("/node_modules/react-router-dom/")
  ) {
    return "vendor-react";
  }
  if (
    normalizedId.includes("/node_modules/i18next/")
    || normalizedId.includes("/node_modules/react-i18next/")
    || normalizedId.includes("/node_modules/use-sync-external-store/")
  ) {
    return "vendor-i18n";
  }
  if (
    normalizedId.includes("/node_modules/@radix-ui/")
    || normalizedId.includes("/node_modules/lucide-react/")
    || normalizedId.includes("/node_modules/@tanstack/")
    || normalizedId.includes("/node_modules/react-hook-form/")
  ) {
    return "vendor-ui";
  }
  return undefined;
}

function serializeCredentialEntryBootstrapForInlineScript(token: string): string {
  return JSON.stringify(token)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function createManagerCredentialEntryBootstrapPlugin(
  mode: string,
  accessToken: string,
): Plugin | undefined {
  if (mode !== "development" || !accessToken) {
    return undefined;
  }

  return {
    name: "sdkwork-manager-iam-credential-entry-bootstrap",
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => ({
        html,
        tags: [
          {
            tag: "script",
            children:
              "globalThis.__SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN__ = "
              + `${serializeCredentialEntryBootstrapForInlineScript(accessToken)};`,
            injectTo: "head-prepend",
          },
        ],
      }),
    },
  };
}

export default defineConfig(({ mode }) => {
  // IAM credential-entry operations receive this only during local development.
  // The canonical runner generates it from the application manifest before Vite starts.
  const credentialEntryBootstrapAccessToken = process.env.SDKWORK_ACCESS_TOKEN ?? "";
  return {
    plugins: [
      createManagerCredentialEntryBootstrapPlugin(mode, credentialEntryBootstrapAccessToken),
      react(),
      tailwindcss(),
    ],
    resolve: {
      // Linked workspace packages are transformed from source. Pin hook-bearing
      // runtime dependencies to one copy so all pages share React's dispatcher.
      dedupe: ["react", "react-dom", "react-i18next", "i18next"],
      alias: {
        react: path.resolve(managerNodeModulesRoot, "react"),
        "react-dom": path.resolve(managerNodeModulesRoot, "react-dom"),
        i18next: path.resolve(i18nRuntimeNodeModulesRoot, "i18next"),
        "react-i18next": path.resolve(i18nRuntimeNodeModulesRoot, "react-i18next"),
        "@sdkwork/i18n-pc-react": workspacePath(
          "sdkwork-appbase/packages/pc-react/foundation/sdkwork-i18n-pc-react/src/index.ts",
        ),
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
        "@sdkwork/iam-pc-admin-user": workspacePath(
          "sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-user/src/index.ts",
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
        "@sdkwork/manager-pc-admin-core": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-core/src/index.ts",
        ),
        "@sdkwork/manager-pc-admin-drive": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-drive/src/index.tsx",
        ),
        "@sdkwork/manager-pc-admin-payment": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-payment/src/index.tsx",
        ),
        "@sdkwork/manager-pc-admin-trade": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-trade/src/index.tsx",
        ),
        "@sdkwork/manager-pc-admin-marketing": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-marketing/src/index.tsx",
        ),
        "@sdkwork/manager-pc-admin-membership": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-membership/src/index.tsx",
        ),
        "@sdkwork/manager-pc-admin-customer": repoPath(
          "apps/sdkwork-manager-pc/packages/sdkwork-manager-pc-admin-customer/src/index.tsx",
        ),
        "@sdkwork/membership-backend-sdk": workspacePath(
          "sdkwork-membership/sdks/sdkwork-membership-backend-sdk/sdkwork-membership-backend-sdk-typescript/src/index.ts",
        ),
        "@sdkwork/membership-service": workspacePath(
          "sdkwork-membership/apps/sdkwork-membership-common/packages/sdkwork-membership-service/src/index.ts",
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
    build: {
      rolldownOptions: {
        output: {
          manualChunks: resolveManagerManualChunk,
        },
      },
    },
    server: {
      // Auth and UI packages are linked from sibling workspaces. Keep Vite's
      // /@fs/ serving boundary explicit so their source can be transformed
      // without allowing arbitrary paths from the host filesystem.
      fs: {
        allow: viteWorkspaceSourceRoots,
      },
      port: 5190,
      strictPort: true,
      host: "127.0.0.1",
    },
  };
});
