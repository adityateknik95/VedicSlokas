import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next.js env files, so load .env.local ourselves (Node 20.12+).
if (!process.env.DATABASE_URL && existsSync(".env.local")) process.loadEnvFile(".env.local");

// `npm run db:generate` writes SQL migrations to ./drizzle from db/schema.ts (no database needed).
// `npm run db:migrate` applies them to DATABASE_URL (Neon). Local PGlite migrates itself on start.
const url = process.env.DATABASE_URL;
const needsDatabase = process.argv.some((arg) => ["migrate", "push", "pull", "studio"].includes(arg));
if (needsDatabase && !url) {
  throw new Error("DATABASE_URL is not set. Paste your Neon connection string into .env.local (and save the file), then try again.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: url ?? "postgres://unused-for-generate" },
  strict: true,
  verbose: true,
});
