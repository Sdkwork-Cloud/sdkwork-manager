import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "apps/sdkwork-manager-common/packages/**/*.test.ts",
      "apps/sdkwork-manager-pc/packages/**/*.test.ts",
    ],
  },
});
