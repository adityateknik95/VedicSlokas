import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

/**
 * For an uptime monitor: 200 with { ok: true, db: true } when the site can reach its
 * database, 503 otherwise. Says nothing about why, and is never cached.
 */
export async function GET() {
  let db = false;
  try {
    const conn = await getDb();
    await conn.execute(sql`select 1`);
    db = true;
  } catch {
    db = false;
  }
  return NextResponse.json({ ok: db, db }, { status: db ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0" } });
}
