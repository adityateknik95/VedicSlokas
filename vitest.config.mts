import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      { find: /^server-only$/, replacement: `${root}tests/stubs/empty.ts` },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Each test file gets a fresh in-memory Postgres; no real services are touched.
    env: { PGLITE_DIR: "memory", BETTER_AUTH_URL: "http://localhost:3000", NODE_ENV: "test" },
    testTimeout: 30_000,
    pool: "forks",
  },
});
