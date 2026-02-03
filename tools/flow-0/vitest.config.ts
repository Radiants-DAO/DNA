import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["app/**/*.test.ts"],
    // Use jsdom for bridge tests that need DOM
    environmentMatchGlobs: [
      ["packages/bridge/src/**/*.test.ts", "jsdom"],
    ],
  },
  resolve: {
    // Allow TypeScript to resolve .js extensions to .ts files
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  esbuild: {
    // Enable ESM interop
    target: "node18",
  },
});
