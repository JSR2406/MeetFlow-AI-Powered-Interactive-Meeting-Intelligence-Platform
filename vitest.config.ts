import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "scripts/**",
        "tests/**",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
    include: ["tests/**/*.{test,spec}.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
