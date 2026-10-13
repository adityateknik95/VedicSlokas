import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * Smoke tests against a production build with no external services:
 * embedded Postgres (fresh .pglite-e2e), emails written to .dev-outbox, in-memory rate limits.
 * VEDIC_E2E=1 relaxes the production env check locally (it is ignored on Vercel).
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the locally installed Chrome; run `npx playwright install chromium` and drop this line to use Playwright's own.
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      VEDIC_E2E: "1",
      // Blank values win over .env.local (and count as unset), so the tests never reach
      // the real Neon database, Resend, Upstash or Google, even once those keys exist locally.
      DATABASE_URL: "",
      RESEND_API_KEY: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      PGLITE_DIR: ".pglite-e2e",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
