import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { NO_ENTITLEMENTS, type Entitlements } from "@/lib/dashboard/modules";

/** Paid modules are entitled only while the server-side subscription is active and unexpired. */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const db = await getDb();
  const [plan] = await db.select().from(schema.studentPlan).where(eq(schema.studentPlan.userId, userId)).limit(1);
  const active = plan?.status === "active" && !!plan.subscriptionExpiresAt && plan.subscriptionExpiresAt > new Date();
  return active ? { liveClasses: true, notes: true, courses: true } : { ...NO_ENTITLEMENTS };
}
