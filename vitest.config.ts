import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["coverage/**", "dist/**", "scripts/**", "vitest.config.ts"],
    },
  },
});
