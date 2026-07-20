import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const uiReactRoot = path.resolve(root, "../sdkwork-ui/sdkwork-ui-pc-react");

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    alias: {
      react: path.resolve(root, "node_modules/react"),
      "react-dom": path.resolve(root, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(root, "node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(root, "node_modules/react/jsx-dev-runtime.js"),
      "lucide-react": path.resolve(
        uiReactRoot,
        "node_modules/lucide-react/dist/esm/lucide-react.js",
      ),
      "@sdkwork/ui-pc-react/theme": path.resolve(uiReactRoot, "src/theme/index.ts"),
      "@sdkwork/ui-pc-react": path.resolve(uiReactRoot, "src/index.ts"),
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
