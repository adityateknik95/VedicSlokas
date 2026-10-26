import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { getPrefs, savePrefs } from "@/lib/dashboard/data";
import type { EmailContent } from "@/lib/email/templates";
import { matchesAll, normalize } from "@/lib/normalize";
import { localClock, remindersBlocked, sendDueReminders, stopDailyEmail } from "@/lib/reminders";
import { readUnsubscribeToken, unsubscribeToken } from "@/lib/unsubscribe-token";

/** Runs against PGlite; emails go to a recording fake, never anywhere real. */

process.env.REMINDERS_ENABLED = "true";
process.env.RESEND_API_KEY = "re_test_only";
process.env.EMAIL_FROM = "VedicSlokas <onboarding@resend.dev>";

async function makeUser(prefs: Parameters<typeof savePrefs>[1]) {
  const db = await getDb();
  const id = randomUUID();
  const email = `${id}@example.com`;
  await db.insert(schema.user).values({ id, name: "Asha Rao", email });
  await savePrefs(id, prefs);
  return { id, email };
}

const recorder = () => {
  const sent: { to: string; content: EmailContent }[] = [];
  return { sent, send: async (to: string, content: EmailContent) => void sent.push({ to, content }) };
};

beforeAll(async () => {
  await getDb();
});

describe("when reminders may send", () => {
  it("never from Resend's shared test sender", () => {
    expect(remindersBlocked()).toMatch(/own verified domain/);
  });
});

describe("local time", () => {
  it("knows the hour and day in the student's timezone", () => {
    const now = new Date("2026-11-02T01:30:00Z");
    expect(localClock(now, "Asia/Kolkata")).toEqual({ hour: 7, day: "2026-11-02" });
    expect(localClock(now, "America/New_York")).toEqual({ hour: 20, day: "2026-11-01" });
  });
});

describe("sending the daily sloka", () => {
  it("at their hour, once per local day, in their script, with an unsubscribe link", async () => {
    const ist = await makeUser({ dailyEmail: true, reminderHour: 7, timezone: "Asia/Kolkata", script: "kannada", meaningLang: "kn" });
    const other = await makeUser({ dailyEmail: true, reminderHour: 9, timezone: "Asia/Kolkata" });
    const off = await makeUser({ dailyEmail: false, reminderHour: 7, timezone: "Asia/Kolkata" });
    const at7 = new Date("2026-11-02T01:30:00Z");

    const first = recorder();
    await sendDueReminders(at7, first.send);
    const mine = first.sent.filter((m) => [ist.email, other.email, off.email].includes(m.to));
    expect(mine.map((m) => m.to)).toEqual([ist.email]);
    const mail = mine[0].content;
    expect(mail.subject).toMatch(/^Today's sloka: /);
    expect(mail.text).toMatch(/[ಀ-೿]/); // Kannada script
    expect(mail.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    const link = mail.text.match(/\/unsubscribe\?u=([^\s]+)/)?.[1];
    expect(readUnsubscribeToken(link)).toBe(ist.id);

    // The same hour again (a retry, or an overlapping run): nothing more.
    const again = recorder();
    await sendDueReminders(new Date("2026-11-02T01:55:00Z"), again.send);
    expect(again.sent.some((m) => m.to === ist.email)).toBe(false);

    // The next local day, same hour: one more.
    const tomorrow = recorder();
    await sendDueReminders(new Date("2026-11-03T01:30:00Z"), tomorrow.send);
    expect(tomorrow.sent.filter((m) => m.to === ist.email)).toHaveLength(1);
  });

  it("a failed send can be retried later that hour", async () => {
    const u = await makeUser({ dailyEmail: true, reminderHour: 18, timezone: "UTC" });
    const at18 = new Date("2026-11-05T18:05:00Z");
    await sendDueReminders(at18, async (to) => {
      if (to === u.email) throw new Error("boom");
    });
    const retry = recorder();
    await sendDueReminders(new Date("2026-11-05T18:40:00Z"), retry.send);
    expect(retry.sent.filter((m) => m.to === u.email)).toHaveLength(1);
  });

  it("unsubscribing stops them", async () => {
    const u = await makeUser({ dailyEmail: true, reminderHour: 6, timezone: "UTC" });
    await stopDailyEmail(u.id);
    expect((await getPrefs(u.id)).dailyEmail).toBe(false);
    const r = recorder();
    await sendDueReminders(new Date("2026-11-06T06:00:00Z"), r.send);
    expect(r.sent.some((m) => m.to === u.email)).toBe(false);
  });
});

describe("unsubscribe tokens", () => {
  it("only the genuine token works", () => {
    const t = unsubscribeToken("user-123");
    expect(readUnsubscribeToken(t)).toBe("user-123");
    const [id, sig] = t.split(".");
    expect(readUnsubscribeToken(`${id}.${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`)).toBeNull();
    expect(readUnsubscribeToken(`${Buffer.from("someone-else").toString("base64url")}.${sig}`)).toBeNull();
    expect(readUnsubscribeToken("junk")).toBeNull();
    expect(readUnsubscribeToken(undefined)).toBeNull();
  });
});

describe("search spelling", () => {
  it("finds a verse however its name is spelt", () => {
    const hay = normalize("Karmaṇy Evādhikāras Te kṛṣṇa Bhagavad Gītā 2.47");
    for (const q of ["krsna", "krishna", "KRISHNA", "gita 2.47", "karmany"]) expect(matchesAll(hay, q)).toBe(true);
    expect(matchesAll(hay, "shiva")).toBe(false);
  });
});
