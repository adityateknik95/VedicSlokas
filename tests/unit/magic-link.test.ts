import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { eq, like } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { confirmMagicLink, requestMagicLink } from "@/lib/auth-flows";
import { DEV_OUTBOX_DIR } from "@/lib/email/send";
import { inspectToken, tokenIdentifier } from "@/lib/magic-token";
import { resetMemoryLimiterForTests } from "@/lib/rate-limit";

const ORIGIN = "http://localhost:3000";
const headers = () => new Headers({ origin: ORIGIN, "user-agent": "vitest" });
const meta = { ip: "203.0.113.7", userAgent: "vitest" };

async function lastEmail(to: string): Promise<{ subject: string; text: string }> {
  return JSON.parse(await readFile(path.join(DEV_OUTBOX_DIR, `${encodeURIComponent(to)}.json`), "utf8"));
}
async function tokenSentTo(to: string): Promise<string> {
  const match = (await lastEmail(to)).text.match(/[?&]token=([A-Za-z0-9]+)/);
  if (!match) throw new Error("no token in email");
  return match[1];
}
const request = (email: string, mode: "login" | "signup" = "login", name?: string) =>
  requestMagicLink({ mode, email, name, callbackUrl: "/dashboard", meta, headers: headers() });

beforeAll(async () => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  await getDb();
});
beforeEach(() => resetMemoryLimiterForTests());
afterEach(async () => {
  vi.useRealTimers();
  await rm(DEV_OUTBOX_DIR, { recursive: true, force: true });
});

describe("magic link", () => {
  it("sign up creates an unverified user with consent, and stores only a hash of the token", async () => {
    const email = "new.student@example.com";
    expect(await request(email, "signup", "New Student")).toEqual({ kind: "sent" });

    const db = await getDb();
    const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    expect(user.emailVerified).toBe(false);
    expect(user.role).toBe("student");
    expect(user.termsAcceptedAt).toBeInstanceOf(Date);
    expect(user.termsVersion).toBeTruthy();

    const token = await tokenSentTo(email);
    const rows = await db.select().from(schema.verification).where(like(schema.verification.identifier, "magic-link:%"));
    expect(rows).toHaveLength(1);
    expect(rows[0].identifier).toBe(tokenIdentifier(token));
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it("is single use, verifies the email, and never logs the token", async () => {
    const email = "single.use@example.com";
    await request(email, "signup", "Single Use");
    const token = await tokenSentTo(email);

    const first = await confirmMagicLink(token, meta, headers());
    expect(first.kind).toBe("ok");
    const second = await confirmMagicLink(token, meta, headers());
    expect(second.kind).toBe("invalid");

    const db = await getDb();
    const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    expect(user.emailVerified).toBe(true);
    const sessions = await db.select().from(schema.session).where(eq(schema.session.userId, user.id));
    expect(sessions).toHaveLength(1);
    const days = (sessions[0].expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);

    const audit = await db.select().from(schema.auditLog);
    expect(audit.map((a) => a.event)).toEqual(expect.arrayContaining(["link_requested", "link_used", "link_invalid"]));
    expect(JSON.stringify(audit)).not.toContain(token);
  });

  it("expires after 15 minutes", async () => {
    const email = "slow.reader@example.com";
    await request(email, "signup", "Slow Reader");
    const token = await tokenSentTo(email);
    const db = await getDb();
    expect(await inspectToken(db, token)).toBe("valid");

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 14 * 60_000);
    expect(await inspectToken(db, token)).toBe("valid");
    vi.setSystemTime(Date.now() + 2 * 60_000);
    expect(await inspectToken(db, token)).toBe("expired");
    expect((await confirmMagicLink(token, meta, headers())).kind).toBe("expired");
  });

  it("a new link invalidates older links for the same email", async () => {
    const email = "two.links@example.com";
    await request(email, "signup", "Two Links");
    const older = await tokenSentTo(email);
    resetMemoryLimiterForTests(); // skip the 60s resend cooldown
    await request(email);
    const newer = await tokenSentTo(email);
    expect(newer).not.toBe(older);

    expect((await confirmMagicLink(older, meta, headers())).kind).toBe("invalid");
    expect((await confirmMagicLink(newer, meta, headers())).kind).toBe("ok");
  });

  it("gives the same answer for unknown and known emails, but sends different emails", async () => {
    const known = "known@example.com";
    await request(known, "signup", "Known");
    resetMemoryLimiterForTests();

    const unknown = "unknown@example.com";
    expect(await request(unknown)).toEqual({ kind: "sent" });
    expect(await request(known)).toEqual({ kind: "sent" });

    expect((await lastEmail(unknown)).subject).toBe("Sign in to VedicSlokas");
    expect((await lastEmail(unknown)).text).toContain("could not find an account");
    expect((await lastEmail(known)).subject).toBe("Your VedicSlokas sign-in link");

    // Logging in never creates an account.
    const db = await getDb();
    expect(await db.select().from(schema.user).where(eq(schema.user.email, unknown))).toHaveLength(0);
  });

  it("enforces a 60 second cooldown between links to the same address", async () => {
    const email = "impatient@example.com";
    await request(email, "signup", "Impatient");
    const second = await request(email);
    expect(second.kind).toBe("rate_limited");
    if (second.kind === "rate_limited") {
      const wait = second.retryAt - Date.now();
      expect(wait).toBeGreaterThan(55_000);
      expect(wait).toBeLessThanOrEqual(60_000);
    }
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 61_000);
    expect((await request(email)).kind).toBe("sent");
  });

  it("rate limits per email (5/hour) with a retry time", async () => {
    const email = "eager@example.com";
    await request(email, "signup", "Eager");
    for (let i = 0; i < 4; i++) {
      // Fresh cooldown window each time, but the hourly per-email budget keeps counting.
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 61_000);
      expect((await request(email)).kind).toBe("sent");
    }
    vi.setSystemTime(Date.now() + 61_000);
    const blocked = await request(email);
    expect(blocked.kind).toBe("rate_limited");
    if (blocked.kind === "rate_limited") expect(blocked.retryAt).toBeGreaterThan(Date.now());
  });

  it("rejects malformed tokens without touching the database", async () => {
    const db = await getDb();
    expect(await inspectToken(db, "")).toBe("missing");
    expect(await inspectToken(db, "short")).toBe("missing");
    expect(await inspectToken(db, "x".repeat(32) + "';--")).toBe("missing");
    expect((await confirmMagicLink("doesnotexistdoesnotexist12345678", meta, headers())).kind).toBe("invalid");
  });
});
