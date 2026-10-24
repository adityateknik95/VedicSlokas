import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { cancelScheduledClass, googleLinkFor, removeGoogleLink, saveGoogleLink, scheduleClass } from "@/lib/class-meetings";
import type { Actor } from "@/lib/classes";
import { exchangeCode, type Fetch } from "@/lib/google-calendar";
import { open, seal } from "@/lib/secret-box";

/** Runs against PGlite, with a fake Google: nothing here reaches the network. */

process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";

type Call = { method: string; url: string; body: string };

/** A pretend Google: tokens, Calendar events with Meet links, revocation. */
function fakeGoogle(opts: { refreshFails?: "invalid_grant" | "server"; createFails?: boolean; scope?: string } = {}) {
  const calls: Call[] = [];
  let n = 0;
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const f: Fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ method, url, body: typeof init?.body === "string" ? init.body : String(init?.body ?? "") });
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      const params = new URLSearchParams(String(init?.body));
      if (params.get("grant_type") === "refresh_token" && opts.refreshFails) return reply(400, { error: opts.refreshFails === "invalid_grant" ? "invalid_grant" : "server_error" });
      return reply(200, { access_token: "access-1", refresh_token: "refresh-1", scope: opts.scope ?? "openid email https://www.googleapis.com/auth/calendar.events" });
    }
    if (url.startsWith("https://openidconnect.googleapis.com/v1/userinfo")) return reply(200, { email: "guru@gmail.com" });
    if (url.startsWith("https://oauth2.googleapis.com/revoke")) return reply(200, {});
    if (url.startsWith("https://www.googleapis.com/calendar/v3/calendars/primary/events")) {
      if (method === "POST") {
        if (opts.createFails) return reply(500, {});
        n += 1;
        return reply(200, { id: `evt-${n}`, hangoutLink: `https://meet.google.com/aaa-bbbb-cc${n}` });
      }
      return method === "DELETE" ? new Response(null, { status: 204 }) : reply(200, {});
    }
    return reply(404, {});
  };
  return { f, calls };
}

async function makeUser(role: "student" | "teacher" | "admin" = "teacher"): Promise<Actor & { email: string }> {
  const db = await getDb();
  const id = randomUUID();
  const email = `${id}@example.com`;
  await db.insert(schema.user).values({ id, name: "Guru", email, role });
  return { id, name: "Guru", email, role };
}

const start = new Date("2026-12-01T13:30:00Z");

beforeAll(async () => {
  await getDb();
});

describe("sealed secrets", () => {
  it("round trips, and refuses tampering or another purpose", () => {
    const sealed = seal("refresh-token-123", "google-refresh-token");
    expect(sealed).not.toContain("refresh-token-123");
    expect(open(sealed, "google-refresh-token")).toBe("refresh-token-123");
    expect(open(sealed, "something-else")).toBeNull();
    const [v, iv, tag, data] = sealed.split(".");
    expect(open([v, iv, tag, data.slice(0, -2) + (data.endsWith("A") ? "B" : "A") + data.slice(-1)].join("."), "google-refresh-token")).toBeNull();
  });
});

describe("connecting Google", () => {
  it("keeps the refresh token encrypted, and insists on Calendar access", async () => {
    const t = await makeUser();
    const { f } = fakeGoogle();
    const granted = await exchangeCode("code-1", f);
    expect(granted).toEqual({ refreshToken: "refresh-1", email: "guru@gmail.com" });
    await saveGoogleLink(t.id, granted.email, granted.refreshToken);
    const db = await getDb();
    const [row] = await db.select().from(schema.googleCalendarLink).where(eq(schema.googleCalendarLink.userId, t.id));
    expect(row.refreshToken).not.toContain("refresh-1");
    expect(await googleLinkFor(t.id)).toEqual({ email: "guru@gmail.com" });

    await expect(exchangeCode("code-2", fakeGoogle({ scope: "openid email" }).f)).rejects.toMatchObject({ code: "no_scope" });
  });
});

describe("scheduling with an automatic Meet link", () => {
  it("needs a connection; then makes a one hour event and stores its link", async () => {
    const t = await makeUser();
    const google = fakeGoogle();
    expect(await scheduleClass(t, { title: "Gita", startsAt: start }, google.f)).toEqual({ ok: false, reason: "google_not_connected" });
    expect(google.calls).toHaveLength(0);

    await saveGoogleLink(t.id, "guru@gmail.com", "refresh-1");
    const made = await scheduleClass(t, { title: "Gita 2.47", description: "Word by word", startsAt: start }, google.f);
    if (!made.ok) throw new Error(made.reason);
    const create = google.calls.find((c) => c.method === "POST" && c.url.includes("/events"));
    const body = JSON.parse(create?.body ?? "{}");
    expect(create?.url).toContain("conferenceDataVersion=1");
    expect(body.conferenceData.createRequest.requestId).toBe(made.id);
    expect(body.start.dateTime).toBe("2026-12-01T13:30:00.000Z");
    expect(body.end.dateTime).toBe("2026-12-01T14:30:00.000Z");

    const db = await getDb();
    const [row] = await db.select().from(schema.liveClass).where(eq(schema.liveClass.id, made.id));
    expect(row.meetingUrl).toMatch(/^https:\/\/meet\.google\.com\//);
    expect(row.googleEventId).toBe("evt-1");
    expect(row.googleOwnerId).toBe(t.id);

    // Moving it moves the event; the link stays the same.
    await scheduleClass(t, { id: made.id, title: "Gita 2.47", startsAt: new Date("2026-12-02T13:30:00Z") }, google.f);
    const patch = google.calls.find((c) => c.method === "PATCH");
    expect(patch?.url).toContain("/events/evt-1");
    expect(JSON.parse(patch?.body ?? "{}").end.dateTime).toBe("2026-12-02T14:30:00.000Z");
    const [moved] = await db.select().from(schema.liveClass).where(eq(schema.liveClass.id, made.id));
    expect(moved.meetingUrl).toBe(row.meetingUrl);

    // Cancelling deletes the event.
    expect(await cancelScheduledClass(t, made.id, google.f)).toEqual({ ok: true });
    expect(google.calls.some((c) => c.method === "DELETE" && c.url.includes("/events/evt-1"))).toBe(true);
  });

  it("switching to a pasted link retires the Calendar event", async () => {
    const t = await makeUser();
    const google = fakeGoogle();
    await saveGoogleLink(t.id, "guru@gmail.com", "refresh-1");
    const made = await scheduleClass(t, { title: "Upanishad", startsAt: start }, google.f);
    if (!made.ok) throw new Error(made.reason);
    await scheduleClass(t, { id: made.id, title: "Upanishad", startsAt: start, meetingUrl: "https://us02web.zoom.us/j/123" }, google.f);
    const db = await getDb();
    const [row] = await db.select().from(schema.liveClass).where(eq(schema.liveClass.id, made.id));
    expect(row.meetingUrl).toBe("https://us02web.zoom.us/j/123");
    expect(row.googleEventId).toBeNull();
    expect(google.calls.some((c) => c.method === "DELETE")).toBe(true);
  });

  it("saves nothing when Google fails, and disconnects a revoked grant", async () => {
    const db = await getDb();
    const t = await makeUser();
    await saveGoogleLink(t.id, "guru@gmail.com", "refresh-1");
    const before = (await db.select().from(schema.liveClass)).length;
    expect(await scheduleClass(t, { title: "X", startsAt: start }, fakeGoogle({ createFails: true }).f)).toEqual({ ok: false, reason: "google_failed" });
    expect((await db.select().from(schema.liveClass)).length).toBe(before);

    expect(await scheduleClass(t, { title: "X", startsAt: start }, fakeGoogle({ refreshFails: "invalid_grant" }).f)).toEqual({ ok: false, reason: "google_not_connected" });
    expect(await googleLinkFor(t.id)).toBeNull();
  });

  it("students cannot schedule, and nothing is sent to Google", async () => {
    const s = await makeUser("student");
    const google = fakeGoogle();
    expect(await scheduleClass(s, { title: "Nope", startsAt: start }, google.f)).toEqual({ ok: false, reason: "forbidden" });
    expect(google.calls).toHaveLength(0);
  });

  it("disconnecting forgets the token and revokes it at Google", async () => {
    const t = await makeUser();
    const google = fakeGoogle();
    await saveGoogleLink(t.id, "guru@gmail.com", "refresh-9");
    await removeGoogleLink(t.id, google.f);
    expect(await googleLinkFor(t.id)).toBeNull();
    const revoke = google.calls.find((c) => c.url.includes("/revoke"));
    expect(revoke?.body).toContain("refresh-9");
  });
});
