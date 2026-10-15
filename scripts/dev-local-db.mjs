// `npm run dev:local`: the app on http://localhost:3001 against a local embedded database
// (PGlite in ./.pglite-dev, migrated automatically), with emails written to ./.dev-outbox and
// no external services. Blank values win over .env.local, so your real keys are never used.
// Use it to work on the dashboard without touching the shared Neon database.
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL: "",
  PGLITE_DIR: ".pglite-dev",
  RESEND_API_KEY: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  BETTER_AUTH_URL: "http://localhost:3001",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
};

const child = spawn("npx", ["next", "dev", "-p", "3001"], { env, stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 0));
