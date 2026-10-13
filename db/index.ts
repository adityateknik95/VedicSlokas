import "server-only";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

// Survives hot reloads in development so we keep one connection / one PGlite instance.
const store = globalThis as unknown as { __vedicDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const { DATABASE_URL, PGLITE_DIR } = env();

  if (DATABASE_URL) {
    // Neon over HTTP: stateless, ideal for serverless functions. Run migrations with `npm run db:migrate`.
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(DATABASE_URL), { schema }) as unknown as Db;
  }

  // Local development and tests: an embedded Postgres, migrated automatically.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = PGLITE_DIR === "memory" ? undefined : path.resolve(/*turbopackIgnore: true*/ PGLITE_DIR ?? ".pglite");
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(/*turbopackIgnore: true*/ process.cwd(), "drizzle") });
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  store.__vedicDb ??= connect().catch((error: unknown) => {
    store.__vedicDb = undefined;
    throw error;
  });
  return store.__vedicDb;
}

export { schema };
