import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { PaymentMode } from "@/db/schema";
import { env } from "@/lib/env";

/**
 * The monthly plan, paid by hand (UPI or bank transfer) and checked by an admin. Free
 * students keep every verse; the plan unlocks the learning modules (live classes, notes,
 * courses) through getEntitlements. Who may see and buy it is SUBSCRIPTIONS in the env.
 */

const { subscription, subscriptionPayment, user } = schema;

/* ───────── Who may see the plan ───────── */

export function canUseSubscriptions(u: { email: string; role?: string | null }): boolean {
  const { SUBSCRIPTIONS, SUBSCRIPTION_TESTERS } = env();
  if (SUBSCRIPTIONS === "on") return true;
  if (SUBSCRIPTIONS === "off") return false;
  if (u.role === "admin") return true;
  const testers = (SUBSCRIPTION_TESTERS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return testers.includes(u.email.toLowerCase());
}

/* ───────── Price and where to pay ───────── */

export const pricePaise = () => env().SUBSCRIPTION_PRICE_INR * 100;

export type PaymentDetails = {
  priceInr: number;
  upi: { id: string; name: string; link: string } | null;
  bank: { holder: string; name: string; account: string; ifsc: string } | null;
};

export function paymentDetails(): PaymentDetails {
  const e = env();
  const priceInr = e.SUBSCRIPTION_PRICE_INR;
  const name = e.PAYMENT_UPI_NAME ?? "VedicSlokas";
  const upi = e.PAYMENT_UPI_ID
    ? {
        id: e.PAYMENT_UPI_ID,
        name,
        link: `upi://pay?${new URLSearchParams({ pa: e.PAYMENT_UPI_ID, pn: name, am: priceInr.toFixed(2), cu: "INR", tn: "VedicSlokas monthly plan" })}`,
      }
    : null;
  const bank =
    e.PAYMENT_BANK_HOLDER && e.PAYMENT_BANK_NAME && e.PAYMENT_BANK_ACCOUNT && e.PAYMENT_BANK_IFSC
      ? { holder: e.PAYMENT_BANK_HOLDER, name: e.PAYMENT_BANK_NAME, account: e.PAYMENT_BANK_ACCOUNT, ifsc: e.PAYMENT_BANK_IFSC }
      : null;
  return { priceInr, upi, bank };
}

/* ───────── Dates ───────── */

/** One calendar month later, clamped to the month's last day (31 Jan → 28/29 Feb). */
export function addOneMonth(from: Date): Date {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/* ───────── The student's plan ───────── */

export type Plan = {
  active: boolean;
  expiresAt: string | null;
  pending: { id: string; mode: PaymentMode; reference: string; amountPaise: number; createdAt: string } | null;
  /** The latest reviewed payment, so the student can see a rejection. */
  lastReviewed: { status: "verified" | "rejected"; reviewedAt: string } | null;
};

export async function getPlan(userId: string, now = new Date()): Promise<Plan> {
  const db = await getDb();
  const [[sub], payments] = await Promise.all([
    db.select().from(subscription).where(eq(subscription.userId, userId)).limit(1),
    db.select().from(subscriptionPayment).where(eq(subscriptionPayment.userId, userId)).orderBy(desc(subscriptionPayment.createdAt)).limit(10),
  ]);
  const pending = payments.find((p) => p.status === "pending");
  const reviewed = payments.find((p) => p.status !== "pending" && p.reviewedAt);
  return {
    active: !!sub && sub.expiresAt > now,
    expiresAt: sub?.expiresAt.toISOString() ?? null,
    pending: pending ? { id: pending.id, mode: pending.mode, reference: pending.reference, amountPaise: pending.amountPaise, createdAt: pending.createdAt.toISOString() } : null,
    lastReviewed: reviewed?.reviewedAt ? { status: reviewed.status as "verified" | "rejected", reviewedAt: reviewed.reviewedAt.toISOString() } : null,
  };
}

export async function hasActiveSubscription(userId: string, now = new Date()): Promise<boolean> {
  const db = await getDb();
  const [sub] = await db.select({ expiresAt: subscription.expiresAt }).from(subscription).where(eq(subscription.userId, userId)).limit(1);
  return !!sub && sub.expiresAt > now;
}

/* ───────── Reporting a payment ───────── */

/** Upper case, without spaces or dashes. UPI UTRs are 12 digits; bank references vary. */
export function normaliseReference(raw: string): string | null {
  const ref = raw.replace(/[\s-]+/g, "").toUpperCase();
  return /^[A-Z0-9]{6,35}$/.test(ref) ? ref : null;
}

function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error, i = 0; e && i < 4; i++) {
    if (typeof e === "object" && "code" in e && (e as { code: unknown }).code === "23505") return true;
    e = typeof e === "object" && "cause" in e ? (e as { cause: unknown }).cause : null;
  }
  return false;
}

export type SubmitResult = { ok: true; id: string } | { ok: false; reason: "invalid_reference" | "already_pending" | "reference_used" };

export async function submitPayment(userId: string, mode: PaymentMode, rawReference: string): Promise<SubmitResult> {
  const reference = normaliseReference(rawReference);
  if (!reference) return { ok: false, reason: "invalid_reference" };
  const db = await getDb();
  const [pending] = await db
    .select({ id: subscriptionPayment.id })
    .from(subscriptionPayment)
    .where(and(eq(subscriptionPayment.userId, userId), eq(subscriptionPayment.status, "pending")))
    .limit(1);
  if (pending) return { ok: false, reason: "already_pending" };
  const id = randomUUID();
  try {
    await db.insert(subscriptionPayment).values({ id, userId, mode, reference, amountPaise: pricePaise() });
  } catch (error) {
    // The database is the final word: a reused reference, or a second pending payment
    // submitted at the same moment, both break a unique index.
    if (!isUniqueViolation(error)) throw error;
    const [used] = await db.select({ id: subscriptionPayment.id }).from(subscriptionPayment).where(eq(subscriptionPayment.reference, reference)).limit(1);
    return { ok: false, reason: used ? "reference_used" : "already_pending" };
  }
  return { ok: true, id };
}

/* ───────── Admin review ───────── */

export type ReviewResult = { ok: true; userId: string | null; expiresAt: string | null } | { ok: false; reason: "not_pending" };

/**
 * Approves or rejects a pending payment. Only one review can win (the update is conditional
 * on the payment still being pending). Approval adds one month, from today or from the end
 * of a subscription that is still running.
 */
export async function reviewPayment(paymentId: string, approve: boolean, reviewerId: string, now = new Date()): Promise<ReviewResult> {
  const db = await getDb();
  const [payment] = await db
    .update(subscriptionPayment)
    .set({ status: approve ? "verified" : "rejected", reviewedAt: now, reviewedBy: reviewerId })
    .where(and(eq(subscriptionPayment.id, paymentId), eq(subscriptionPayment.status, "pending")))
    .returning({ userId: subscriptionPayment.userId });
  if (!payment) return { ok: false, reason: "not_pending" };
  if (!approve || !payment.userId) return { ok: true, userId: payment.userId, expiresAt: null };

  const [current] = await db.select().from(subscription).where(eq(subscription.userId, payment.userId)).limit(1);
  const from = current && current.expiresAt > now ? current.expiresAt : now;
  const expiresAt = addOneMonth(from);
  await db
    .insert(subscription)
    .values({ userId: payment.userId, startedAt: now, expiresAt, updatedAt: now })
    .onConflictDoUpdate({
      target: subscription.userId,
      set: { expiresAt, updatedAt: now, startedAt: current && current.expiresAt > now ? current.startedAt : now },
    });
  return { ok: true, userId: payment.userId, expiresAt: expiresAt.toISOString() };
}

export type PaymentRow = {
  id: string;
  name: string | null;
  email: string | null;
  amountPaise: number;
  mode: PaymentMode;
  reference: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
};

/** Pending first (oldest first, so nobody waits longest), then the latest reviewed ones. */
export async function listPayments(limit = 200): Promise<PaymentRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: subscriptionPayment.id,
      name: user.name,
      email: user.email,
      amountPaise: subscriptionPayment.amountPaise,
      mode: subscriptionPayment.mode,
      reference: subscriptionPayment.reference,
      status: subscriptionPayment.status,
      createdAt: subscriptionPayment.createdAt,
      reviewedAt: subscriptionPayment.reviewedAt,
    })
    .from(subscriptionPayment)
    .leftJoin(user, eq(subscriptionPayment.userId, user.id))
    .orderBy(sql`${subscriptionPayment.status} <> 'pending'`, sql`case when ${subscriptionPayment.status} = 'pending' then ${subscriptionPayment.createdAt} end asc`, desc(subscriptionPayment.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), reviewedAt: r.reviewedAt?.toISOString() ?? null }));
}

/** For the student's data export. */
export async function paymentsFor(userId: string) {
  const db = await getDb();
  const rows = await db.select().from(subscriptionPayment).where(eq(subscriptionPayment.userId, userId)).orderBy(desc(subscriptionPayment.createdAt));
  return rows.map((p) => ({ mode: p.mode, reference: p.reference, amountPaise: p.amountPaise, status: p.status, createdAt: p.createdAt.toISOString(), reviewedAt: p.reviewedAt?.toISOString() ?? null }));
}
