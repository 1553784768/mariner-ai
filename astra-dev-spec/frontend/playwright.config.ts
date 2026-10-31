import { defineConfig } from "@playwright/test";
import { createRequire } from "node:module";
const requireFixture = createRequire(__filename);
const fontResponses: string = requireFixture("../scripts/prepare-test-fonts.cjs");
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  webServer: [
    {
      command: "node ../scripts/e2e-backend.mjs",
      url: "http://127.0.0.1:8001/api/health",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "npx next dev -H 127.0.0.1 -p 3001",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: false,
      timeout: 180000,
      env: {
        NEXT_PUBLIC_API_BASE: "http://127.0.0.1:8001",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_DIST_DIR: ".next-e2e-v02",
        NEXT_FONT_GOOGLE_MOCKED_RESPONSES: fontResponses,
      },
    },
  ],
});
