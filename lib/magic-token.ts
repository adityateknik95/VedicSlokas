import "server-only";
import { createHash } from "node:crypto";
import { and, eq, like, sql } from "drizzle-orm";
import { getDb, schema, type Db } from "@/db";

/**
 * Helpers around Better Auth's magic-link tokens. The plugin stores
 * `magic-link:<base64url(sha256(token))>` as the verification identifier, so we can look a
 * token up by hash without ever storing or logging the raw value.
 */
export function tokenIdentifier(token: string): string {
  return `magic-link:${createHash("sha256").update(token).digest("base64url")}`;
}

export type TokenState = "valid" | "expired" | "missing";

/** Read-only check used to show a precise message. The actual consumption is atomic in Better Auth. */
export async function inspectToken(db: Db, token: string, now: Date = new Date()): Promise<TokenState> {
  if (!/^[A-Za-z0-9]{16,128}$/.test(token)) return "missing";
  const [row] = await db
    .select({ expiresAt: schema.verification.expiresAt })
    .from(schema.verification)
    .where(eq(schema.verification.identifier, tokenIdentifier(token)))
    .limit(1);
  if (!row) return "missing";
  return row.expiresAt.getTime() < now.getTime() ? "expired" : "valid";
}

/** "Requesting a new link invalidates older ones for that email." */
export async function invalidatePendingLinks(db: Db, email: string): Promise<void> {
  await db
    .delete(schema.verification)
    .where(and(like(schema.verification.identifier, "magic-link:%"), sql`(${schema.verification.value})::jsonb ->> 'email' = ${email.toLowerCase()}`));
}

/** The email a still-pending token was issued for (shown on the confirm page). */
export async function emailForToken(db: Db, token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9]{16,128}$/.test(token)) return null;
  const [row] = await db
    .select({ value: schema.verification.value })
    .from(schema.verification)
    .where(eq(schema.verification.identifier, tokenIdentifier(token)))
    .limit(1);
  if (!row) return null;
  try {
    const parsed: unknown = JSON.parse(row.value);
    return typeof parsed === "object" && parsed !== null && "email" in parsed && typeof parsed.email === "string" ? parsed.email : null;
  } catch {
    return null;
  }
}

/** Deletes one pending link (used by "This was not me"). Returns the email it was for, if any. */
export async function cancelMagicLink(token: string): Promise<string | null> {
  const db = await getDb();
  const email = await emailForToken(db, token);
  if (email) await db.delete(schema.verification).where(eq(schema.verification.identifier, tokenIdentifier(token)));
  return email;
}
