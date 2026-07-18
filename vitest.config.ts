import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@sdkwork/sdk-common": path.resolve(
        root,
        "../sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts",
      ),
      "@sdkwork/manager-backend-sdk": path.resolve(
        root,
        "sdks/sdkwork-manager-backend-sdk/sdkwork-manager-backend-sdk-typescript/src/index.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "apps/sdkwork-manager-common/packages/**/*.test.ts",
      "apps/sdkwork-manager-pc/packages/**/*.test.ts",
    ],
  },
});
