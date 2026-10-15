import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { deleteAccount } from "@/lib/dashboard/data";
import { getEntitlements } from "@/lib/entitlements";
import { addOneMonth, canUseSubscriptions, getPlan, normaliseReference, reviewPayment, submitPayment } from "@/lib/subscriptions";

/** Runs against a fresh in-memory Postgres (PGlite) with the real migrations applied. */

process.env.SUBSCRIPTIONS = "testers";
process.env.SUBSCRIPTION_TESTERS = "Tester@Example.com, second@example.com";

async function makeUser(role: "student" | "admin" = "student") {
  const db = await getDb();
  const id = randomUUID();
  const email = `${id}@example.com`;
  await db.insert(schema.user).values({ id, name: "Student", email, role });
  return { id, email };
}

let utr = 400000000000;
const nextUtr = () => String(utr++);

beforeAll(async () => {
  await getDb();
});

describe("who sees the plan while testing", () => {
  it("admins and listed testers only, ignoring case", () => {
    expect(canUseSubscriptions({ email: "someone@example.com", role: "admin" })).toBe(true);
    expect(canUseSubscriptions({ email: "tester@example.com", role: "student" })).toBe(true);
    expect(canUseSubscriptions({ email: "SECOND@example.com" })).toBe(true);
    expect(canUseSubscriptions({ email: "student@example.com", role: "student" })).toBe(false);
  });
});

describe("references and dates", () => {
  it("normalises references and rejects junk", () => {
    expect(normaliseReference(" 4123 4567 8901 ")).toBe("412345678901");
    expect(normaliseReference("hdfc-n123456789")).toBe("HDFCN123456789");
    expect(normaliseReference("12345")).toBeNull();
    expect(normaliseReference("<script>")).toBeNull();
  });

  it("adds one calendar month, clamping to the month's end", () => {
    expect(addOneMonth(new Date("2026-01-31T10:00:00Z")).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(addOneMonth(new Date("2028-01-31T10:00:00Z")).toISOString()).toBe("2028-02-29T10:00:00.000Z");
    expect(addOneMonth(new Date("2026-10-15T08:00:00Z")).toISOString()).toBe("2026-11-15T08:00:00.000Z");
    expect(addOneMonth(new Date("2026-12-20T08:00:00Z")).toISOString()).toBe("2027-01-20T08:00:00.000Z");
  });
});

describe("reporting a payment", () => {
  it("one pending payment at a time, and a reference can never be used twice", async () => {
    const a = await makeUser();
    const b = await makeUser();
    expect(await submitPayment(a.id, "upi", "nope")).toEqual({ ok: false, reason: "invalid_reference" });
    const ref = nextUtr();
    const first = await submitPayment(a.id, "upi", ref);
    expect(first.ok).toBe(true);
    expect(await submitPayment(a.id, "upi", nextUtr())).toEqual({ ok: false, reason: "already_pending" });
    // Someone else claiming the same transfer, even written differently.
    expect(await submitPayment(b.id, "bank", ` ${ref.slice(0, 4)} ${ref.slice(4)} `)).toEqual({ ok: false, reason: "reference_used" });
    const plan = await getPlan(a.id);
    expect(plan.active).toBe(false);
    expect(plan.pending?.reference).toBe(ref);
    expect(plan.pending?.amountPaise).toBe(7900);
  });
});

describe("admin review", () => {
  it("approval grants a month, renewals extend it, and only one review wins", async () => {
    const admin = await makeUser("admin");
    const s = await makeUser();
    expect(await getEntitlements(s.id)).toEqual({ liveClasses: false, notes: false, courses: false });

    const now = new Date("2026-10-15T08:00:00Z");
    const first = await submitPayment(s.id, "upi", nextUtr());
    if (!first.ok) throw new Error("submit failed");
    const approved = await reviewPayment(first.id, true, admin.id, now);
    expect(approved).toEqual({ ok: true, userId: s.id, expiresAt: "2026-11-15T08:00:00.000Z" });
    // A second click, or a second admin, changes nothing.
    expect(await reviewPayment(first.id, false, admin.id, now)).toEqual({ ok: false, reason: "not_pending" });

    expect((await getPlan(s.id, now)).active).toBe(true);
    expect(await getEntitlements(s.id)).toEqual({ liveClasses: true, notes: true, courses: true });

    // Paying again before it ends adds a month after the current end, not from today.
    const renewal = await submitPayment(s.id, "bank", nextUtr());
    if (!renewal.ok) throw new Error("submit failed");
    const extended = await reviewPayment(renewal.id, true, admin.id, new Date("2026-11-01T08:00:00Z"));
    expect(extended.ok && extended.expiresAt).toBe("2026-12-15T08:00:00.000Z");

    // After it ends, access ends.
    expect((await getPlan(s.id, new Date("2026-12-16T00:00:00Z"))).active).toBe(false);
  });

  it("a rejected payment grants nothing and frees the student to try again", async () => {
    const admin = await makeUser("admin");
    const s = await makeUser();
    const p = await submitPayment(s.id, "upi", nextUtr());
    if (!p.ok) throw new Error("submit failed");
    expect(await reviewPayment(p.id, false, admin.id)).toEqual({ ok: true, userId: s.id, expiresAt: null });
    const plan = await getPlan(s.id);
    expect(plan.active).toBe(false);
    expect(plan.pending).toBeNull();
    expect(plan.lastReviewed?.status).toBe("rejected");
    expect((await submitPayment(s.id, "upi", nextUtr())).ok).toBe(true);
  });
});

describe("deleting an account", () => {
  it("removes the subscription but keeps the payment for the accounts, anonymised", async () => {
    const db = await getDb();
    const admin = await makeUser("admin");
    const s = await makeUser();
    const p = await submitPayment(s.id, "upi", nextUtr());
    if (!p.ok) throw new Error("submit failed");
    await reviewPayment(p.id, true, admin.id);
    await deleteAccount(s.id, s.email);
    expect(await db.select().from(schema.subscription).where(eq(schema.subscription.userId, s.id))).toEqual([]);
    const [kept] = await db.select().from(schema.subscriptionPayment).where(eq(schema.subscriptionPayment.id, p.id));
    expect(kept.userId).toBeNull();
    expect(kept.status).toBe("verified");
  });
});
