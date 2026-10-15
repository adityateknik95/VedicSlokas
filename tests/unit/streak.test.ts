import { describe, expect, it } from "vitest";
import { computeStreak, dayKey, lastDays, safeTimeZone, shiftDay } from "@/lib/dashboard/streak";

describe("dayKey (the calendar day in the student's timezone)", () => {
  const evening = new Date("2026-10-13T20:00:00Z");

  it("is the next day in India while still the 13th in UTC and New York", () => {
    expect(dayKey(evening, "UTC")).toBe("2026-10-13");
    expect(dayKey(evening, "Asia/Kolkata")).toBe("2026-10-14"); // 01:30 IST
    expect(dayKey(evening, "America/New_York")).toBe("2026-10-13"); // 16:00 EDT
  });

  it("handles exact midnight boundaries", () => {
    expect(dayKey(new Date("2026-10-13T18:29:59Z"), "Asia/Kolkata")).toBe("2026-10-13");
    expect(dayKey(new Date("2026-10-13T18:30:00Z"), "Asia/Kolkata")).toBe("2026-10-14");
  });

  it("handles half-hour and far-east zones", () => {
    expect(dayKey(new Date("2026-10-13T11:00:00Z"), "Pacific/Kiritimati")).toBe("2026-10-14"); // UTC+14
    expect(dayKey(new Date("2026-10-13T11:00:00Z"), "Pacific/Pago_Pago")).toBe("2026-10-13"); // UTC-11
  });

  it("falls back to UTC for unknown timezones", () => {
    expect(safeTimeZone("Mars/Olympus")).toBe("UTC");
    expect(safeTimeZone(null)).toBe("UTC");
    expect(dayKey(evening, "Not/AZone")).toBe("2026-10-13");
  });
});

describe("day arithmetic", () => {
  it("crosses months, years and leap days", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftDay("2026-03-08", 1)).toBe("2026-03-09"); // US daylight saving starts: still one calendar day
  });

  it("lists the last n days oldest first", () => {
    expect(lastDays("2026-10-14", 3)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
  });
});

describe("computeStreak", () => {
  const today = "2026-10-14";

  it("is zero for a new student", () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0, activeToday: false });
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-10-12", "2026-10-13", "2026-10-14"], today)).toEqual({ current: 3, longest: 3, activeToday: true });
  });

  it("keeps yesterday's streak alive until today ends (no mid-day reset)", () => {
    const s = computeStreak(["2026-10-12", "2026-10-13"], today);
    expect(s.current).toBe(2);
    expect(s.activeToday).toBe(false);
  });

  it("breaks after a full missed day", () => {
    expect(computeStreak(["2026-10-10", "2026-10-11", "2026-10-12"], today).current).toBe(0);
  });

  it("remembers the longest run", () => {
    const s = computeStreak(["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-10-13", "2026-10-14"], today);
    expect(s.current).toBe(2);
    expect(s.longest).toBe(4);
  });

  it("ignores duplicates and order", () => {
    expect(computeStreak(["2026-10-14", "2026-10-13", "2026-10-14", "2026-10-13"], today).current).toBe(2);
  });

  it("counts across a month boundary", () => {
    expect(computeStreak(["2026-09-30", "2026-10-01"], "2026-10-01").current).toBe(2);
  });

  it("ignores days in the future (clock skew)", () => {
    expect(computeStreak(["2026-10-15", "2026-10-16"], today)).toEqual({ current: 0, longest: 0, activeToday: false });
  });
});
