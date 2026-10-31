import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

// Exercise Vite's development module transformation; preview-only tests cannot
// catch failures resolving the self-hosted compiler inside the module worker.
export default defineConfig({
  ...base,
  testMatch: "compiler.dev.mjs",
  testIgnore: [],
  reporter: "list",
  outputDir: "test-results/dev",
  use: { ...base.use, baseURL: "http://127.0.0.1:5182" },
  webServer: {
    command:
      "VITE_SUPABASE_DISABLED=true npm run dev -- --host 127.0.0.1 --port 5182 --strictPort",
    url: "http://127.0.0.1:5182",
    reuseExistingServer: false,
  },
});
