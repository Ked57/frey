import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
  coverage: {
    provider: "v8",
    all: true,
    include: ["src/**/*.ts"],
    exclude: ["tests/**", "dist/**", "src/example.ts"],
    reporter: ["text"],
    thresholds: {
      // Start from the current baseline; raise per v3 TDD milestones.
      statements: 50,
      branches: 70,
      functions: 70,
      lines: 50,
    },
  },
});
