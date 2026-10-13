import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, schema } from "@/db";
import type { AuditEvent } from "@/db/schema";

type AuditInput = {
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  /** Small, non-sensitive context only. Never tokens, links or secrets. */
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Records a security-relevant auth event. Failures to write are reported but never
 * break the user's flow.
 */
export async function audit(event: AuditEvent, input: AuditInput = {}): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.auditLog).values({
      id: randomUUID(),
      event,
      userId: input.userId ?? null,
      email: input.email?.toLowerCase() ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("[audit] failed to record event", event, error instanceof Error ? error.message : error);
  }
}
