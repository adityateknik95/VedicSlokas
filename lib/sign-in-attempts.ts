import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import { MAGIC_LINK_MINUTES } from "./auth";
import { siteOrigin } from "./env";

/**
 * Lets the tab that asked for a link notice when the link was used, even on another
 * device. The browser holds a random secret (httpOnly cookie); the database holds only
 * its hash. Knowing an attempt was completed never grants a session by itself.
 */
export const ATTEMPT_COOKIE = "vs_attempt";
const hashId = (secret: string) => createHash("sha256").update(secret).digest("base64url");

export async function startAttempt(email: string): Promise<void> {
  const secret = randomBytes(32).toString("base64url");
  const db = await getDb();
  await db.insert(schema.signInAttempt).values({
    id: hashId(secret),
    email: email.toLowerCase(),
    expiresAt: new Date(Date.now() + MAGIC_LINK_MINUTES * 60 * 1000),
  });
  (await cookies()).set(ATTEMPT_COOKIE, secret, {
    httpOnly: true,
    secure: siteOrigin().startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: MAGIC_LINK_MINUTES * 60,
  });
}

export type Attempt = { email: string; completed: boolean; expired: boolean; createdAt: Date };

export async function currentAttempt(): Promise<Attempt | null> {
  const secret = (await cookies()).get(ATTEMPT_COOKIE)?.value;
  if (!secret) return null;
  const db = await getDb();
  const [row] = await db.select().from(schema.signInAttempt).where(eq(schema.signInAttempt.id, hashId(secret))).limit(1);
  if (!row) return null;
  return { email: row.email, completed: row.completedAt !== null, expired: row.expiresAt.getTime() < Date.now(), createdAt: row.createdAt };
}

/** Marks every open attempt for this email as done (the link was used somewhere). */
export async function completeAttempts(email: string): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.signInAttempt)
    .set({ completedAt: new Date() })
    .where(and(eq(schema.signInAttempt.email, email.toLowerCase()), isNull(schema.signInAttempt.completedAt), gt(schema.signInAttempt.expiresAt, new Date())));
}

export async function clearAttemptCookie(): Promise<void> {
  (await cookies()).delete(ATTEMPT_COOKIE);
}
