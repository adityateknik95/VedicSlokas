import { describe, expect, it } from "vitest";
import { RECENT_SIGN_IN_MS, signedInRecently } from "@/lib/dashboard/api";
import { activeModule, MODULES, moduleAccess, modulesFor, NO_ENTITLEMENTS, type DashboardModule } from "@/lib/dashboard/modules";
import { deleteBody, favouriteBody, interestBody, prefsBody, profileBody, viewBody } from "@/lib/dashboard/schemas";
import { getEntitlements } from "@/lib/entitlements";
import { isSlokaSlug, slokas } from "@/lib/slokas";

describe("slug validation", () => {
  it("accepts every slug in data/slokas.json", () => {
    for (const s of slokas) expect(isSlokaSlug(s.slug)).toBe(true);
  });

  it.each(["", "nope", "../etc/passwd", "GAYATRI-MANTRA", " gayatri-mantra", 7, null, undefined, {}])("rejects %s", (v) => {
    expect(isSlokaSlug(v)).toBe(false);
  });

  it("is enforced on every write body", () => {
    const real = slokas[0].slug;
    expect(favouriteBody.safeParse({ slug: real, saved: true }).success).toBe(true);
    expect(favouriteBody.safeParse({ slug: "junk", saved: true }).success).toBe(false);
    expect(viewBody.safeParse({ slug: "junk" }).success).toBe(false);
    // No sneaking a user id in: unknown keys are refused.
    expect(favouriteBody.safeParse({ slug: real, saved: true, userId: "someone-else" }).success).toBe(false);
  });

  it("validates the rest of the inputs", () => {
    expect(viewBody.safeParse({ slug: slokas[0].slug, tz: "Asia/Kolkata" }).success).toBe(true);
    expect(viewBody.safeParse({ slug: slokas[0].slug, tz: "Mars/Olympus" }).success).toBe(false);
    expect(interestBody.safeParse({ feature: "live_classes", on: true }).success).toBe(true);
    expect(interestBody.safeParse({ feature: "payments", on: true }).success).toBe(false);
    expect(prefsBody.safeParse({ interests: ["peace", "courage"] }).success).toBe(true);
    expect(prefsBody.safeParse({ interests: ["sleep"] }).success).toBe(false);
    expect(profileBody.safeParse({ name: "  Asha Rao  " }).data?.name).toBe("Asha Rao");
    expect(profileBody.safeParse({ name: "<script>" }).success).toBe(false);
    expect(profileBody.safeParse({ name: "x".repeat(81) }).success).toBe(false);
    expect(deleteBody.safeParse({ confirm: "DELETE" }).success).toBe(true);
    expect(deleteBody.safeParse({ confirm: "delete" }).success).toBe(false);
  });
});

describe("module registry", () => {
  it("has unique keys and routes under /dashboard", () => {
    expect(new Set(MODULES.map((m) => m.key)).size).toBe(MODULES.length);
    for (const m of MODULES) if (m.href !== "surprise") expect(m.href.startsWith("/dashboard")).toBe(true);
  });

  it("gives the phone tab bar five items with Surprise in the middle", () => {
    const tabs = modulesFor("tabBar").map((m) => m.key);
    expect(tabs).toEqual(["home", "library", "surprise", "favourites", "settings"]);
  });

  it("puts the three coming-soon modules on the home rail, each with an interest signal", () => {
    const rail = modulesFor("homeRail");
    expect(rail.map((m) => m.key)).toEqual(["classes", "notes", "courses"]);
    for (const m of rail) {
      expect(m.status).toBe("soon");
      expect(m.feature).toBeTruthy();
      expect(m.summary).toBeTruthy();
    }
  });

  it("finds the active module, preferring the most specific route", () => {
    expect(activeModule("/dashboard")?.key).toBe("home");
    expect(activeModule("/dashboard/favourites")?.key).toBe("favourites");
    expect(activeModule("/dashboard/library")?.key).toBe("library");
    expect(activeModule("/dashboard/welcome")).toBeUndefined();
  });
});

describe("entitlement gating", () => {
  const paid: Pick<DashboardModule, "status" | "requires"> = { status: "live", requires: "liveClasses" };

  it("shows coming soon while a module is not built, whatever the plan", () => {
    expect(moduleAccess({ status: "soon", requires: "liveClasses" }, { ...NO_ENTITLEMENTS, liveClasses: true })).toBe("soon");
  });

  it("locks a live paid module for students without the entitlement", () => {
    expect(moduleAccess(paid, NO_ENTITLEMENTS)).toBe("locked");
  });

  it("opens a live paid module for entitled students", () => {
    expect(moduleAccess(paid, { ...NO_ENTITLEMENTS, liveClasses: true })).toBe("open");
  });

  it("opens free live modules for everyone", () => {
    expect(moduleAccess({ status: "live" }, NO_ENTITLEMENTS)).toBe("open");
  });

  it("grants nothing today (no subscriptions yet)", async () => {
    expect(await getEntitlements("anyone")).toEqual({ liveClasses: false, notes: false, courses: false });
  });
});

describe("permanent actions need a recent sign-in", () => {
  const now = Date.parse("2026-10-15T12:00:00Z");
  const startedAgo = (ms: number) => ({ session: { createdAt: new Date(now - ms) } });

  it("allows a session that signed in within the hour", () => {
    expect(signedInRecently(startedAgo(5 * 60 * 1000), now)).toBe(true);
    expect(signedInRecently(startedAgo(RECENT_SIGN_IN_MS), now)).toBe(true);
  });

  it("refuses an older session, and anything it cannot read", () => {
    expect(signedInRecently(startedAgo(RECENT_SIGN_IN_MS + 1), now)).toBe(false);
    expect(signedInRecently(startedAgo(20 * 24 * 60 * 60 * 1000), now)).toBe(false);
    expect(signedInRecently({ session: { createdAt: "not a date" } }, now)).toBe(false);
  });
});
