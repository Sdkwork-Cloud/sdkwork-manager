import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Package imports resolve through pnpm workspace links and package exports
    // maps (APP_PC_ARCHITECTURE_SPEC section 2.0.1); no package aliases are
    // declared. Hook-bearing runtime dependencies are pinned with dedupe.
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  test: {
    environment: "jsdom",
    server: {
      deps: {
        inline: [/@radix-ui\/.*/, /@sdkwork\/ui-pc-react/],
      },
    },
    include: [
      "apps/sdkwork-manager-common/packages/**/*.test.ts",
      "apps/sdkwork-manager-pc/tests/**/*.test.ts",
      "apps/sdkwork-manager-pc/packages/**/*.test.ts",
    ],
  },
});
