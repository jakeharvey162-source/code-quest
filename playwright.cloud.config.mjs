import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";
export default defineConfig({
  ...base,
  timeout: 30000,
  testMatch: "cloud.spec.mjs",
  testIgnore: [],
  use: { ...base.use, baseURL: "http://127.0.0.1:5174" },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://mock-codequest.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
