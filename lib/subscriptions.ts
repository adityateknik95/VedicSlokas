import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type PlanState = "trial" | "pending" | "active" | "expired" | "none";

export async function getPlanState(userId: string) {
  const db = await getDb();
  const [plan] = await db.select().from(schema.studentPlan).where(eq(schema.studentPlan.userId, userId)).limit(1);
  const [payment] = await db.select().from(schema.subscriptionPayment).where(eq(schema.subscriptionPayment.userId, userId)).orderBy(desc(schema.subscriptionPayment.createdAt)).limit(1);
  let status: PlanState = plan?.status ?? "none";
  if (plan?.status === "active" && (!plan.subscriptionExpiresAt || plan.subscriptionExpiresAt <= new Date())) status = "expired";
  return {
    status,
    trialStartedAt: plan?.trialStartedAt?.toISOString() ?? null,
    subscriptionExpiresAt: plan?.subscriptionExpiresAt?.toISOString() ?? null,
    payment: payment ? { id: payment.id, mode: payment.mode, utr: payment.utr, status: payment.status, createdAt: payment.createdAt.toISOString() } : null,
  };
}

export async function startTrial(userId: string) {
  const db = await getDb();
  const [existing] = await db.select().from(schema.studentPlan).where(eq(schema.studentPlan.userId, userId)).limit(1);
  if (existing) {
    if (existing.status === "trial") return;
    throw new Error("PLAN_ALREADY_SELECTED");
  }
  const now = new Date();
  await db.insert(schema.studentPlan).values({ userId, status: "trial", trialStartedAt: now, updatedAt: now });
}

export async function submitPayment(userId: string, mode: "upi" | "bank", utr: string) {
  const db = await getDb();
  const now = new Date();
  const [existing] = await db.select().from(schema.studentPlan).where(eq(schema.studentPlan.userId, userId)).limit(1);
  if (existing?.status === "active" && existing.subscriptionExpiresAt && existing.subscriptionExpiresAt > now) {
    throw new Error("ALREADY_SUBSCRIBED");
  }
  const id = crypto.randomUUID();
  await db.insert(schema.subscriptionPayment).values({ id, userId, amountPaise: 7900, mode, utr: utr.trim(), status: "pending", createdAt: now });
  await db.insert(schema.studentPlan).values({ userId, status: "pending", updatedAt: now }).onConflictDoUpdate({ target: schema.studentPlan.userId, set: { status: "pending", updatedAt: now } });
  return id;
}

export async function verifyPayment(paymentId: string, verified: boolean) {
  const db = await getDb();
  const [payment] = await db.select().from(schema.subscriptionPayment).where(eq(schema.subscriptionPayment.id, paymentId)).limit(1);
  if (!payment || payment.status !== "pending") throw new Error("PAYMENT_NOT_PENDING");
  const now = new Date();
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + 1);
  await db.update(schema.subscriptionPayment).set({ status: verified ? "verified" : "rejected", verifiedAt: now }).where(eq(schema.subscriptionPayment.id, paymentId));
  await db.insert(schema.studentPlan).values({
    userId: payment.userId,
    status: verified ? "active" : "expired",
    subscriptionStartedAt: verified ? now : null,
    subscriptionExpiresAt: verified ? expiry : null,
    updatedAt: now,
  }).onConflictDoUpdate({ target: schema.studentPlan.userId, set: {
    status: verified ? "active" : "expired",
    subscriptionStartedAt: verified ? now : null,
    subscriptionExpiresAt: verified ? expiry : null,
    updatedAt: now,
  } });
}
