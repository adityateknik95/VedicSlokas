"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { THEME_KEY } from "@/components/ui/ThemeToggle";
import { browserTimeZone, failureMessage, meFetch } from "@/lib/dashboard/client";
import type { Theme } from "@/lib/types";
import { toast } from "@/lib/toast";

type ThemeChoice = { key: Theme; label: string; devanagari: string };
type Prefs = { interests: Theme[]; dailyEmail: boolean; timezone: string | null; motion: "system" | "reduce" };
type SiteTheme = "night" | "parchment";

const COLORS: Record<SiteTheme, string> = { night: "#0E0B1F", parchment: "#F3E7CF" };

/** Interests, daily email, timezone, motion and theme. Each change saves on its own. */
export function PreferencesForm({ prefs, themes }: { prefs: Prefs; themes: ThemeChoice[] }) {
  const router = useRouter();
  const [interests, setInterests] = useState(prefs.interests);
  const [dailyEmail, setDailyEmail] = useState(prefs.dailyEmail);
  const [timezone, setTimezone] = useState(prefs.timezone ?? "");
  const [motion, setMotion] = useState(prefs.motion);
  const [siteTheme, setSiteTheme] = useState<SiteTheme>("night");
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    setSiteTheme(document.documentElement.dataset.theme === "parchment" ? "parchment" : "night");
    try {
      setZones(Intl.supportedValuesOf("timeZone"));
    } catch {
      setZones([browserTimeZone()]);
    }
    if (!prefs.timezone) setTimezone(browserTimeZone());
  }, [prefs.timezone]);

  const zoneOptions = useMemo(() => (timezone && !zones.includes(timezone) ? [timezone, ...zones] : zones), [zones, timezone]);

  const save = async (patch: Partial<Prefs>, undo: () => void, what: string) => {
    try {
      await meFetch("/api/me/prefs", { method: "PATCH", body: patch });
      toast(`${what} saved.`);
      if ("motion" in patch) router.refresh();
    } catch (error) {
      undo();
      toast(failureMessage(error, `save ${what.toLowerCase()}`), { tone: "error" });
    }
  };

  const toggleInterest = (t: Theme) => {
    const before = interests;
    const next = interests.includes(t) ? interests.filter((x) => x !== t) : [...interests, t];
    setInterests(next);
    void save({ interests: next }, () => setInterests(before), "Interests");
  };

  const applyTheme = (next: SiteTheme) => {
    setSiteTheme(next);
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLORS[next]);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage unavailable: the theme lasts for this visit.
    }
  };

  const radio = "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm has-[:checked]:border-saffron has-[:checked]:bg-saffron/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-flame";

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Themes you care about</legend>
        <p className="mt-1 text-xs text-ink-muted">Surprise me leans towards these.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {themes.map((t) => {
            const on = interests.includes(t.key);
            return (
              <label key={t.key} className={`${radio} ${on ? "" : "border-line hover:border-gold"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleInterest(t.key)} />
                <span lang="sa" aria-hidden="true" className="deva text-base text-accent">
                  {t.devanagari}
                </span>
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-flame">
        <span>
          <span className="block text-sm font-medium text-ink">Daily sloka email</span>
          <span className="block text-xs text-ink-muted">One verse each morning. We are setting this up; opting in now means you get the first one.</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="sr-only"
          checked={dailyEmail}
          onChange={(e) => {
            const next = e.target.checked;
            setDailyEmail(next);
            void save({ dailyEmail: next }, () => setDailyEmail(!next), "Daily email");
          }}
        />
        <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${dailyEmail ? "border-saffron bg-saffron" : "border-line bg-surface-2"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-transform duration-300 ${dailyEmail ? "translate-x-[1.35rem]" : "translate-x-0.5"}`} />
        </span>
      </label>

      <div>
        <label htmlFor="tz" className="block text-sm font-medium text-ink">
          Timezone
        </label>
        <p className="mt-1 text-xs text-ink-muted">Streaks and greetings follow your local day.</p>
        <select
          id="tz"
          value={timezone}
          onChange={(e) => {
            const before = timezone;
            setTimezone(e.target.value);
            void save({ timezone: e.target.value }, () => setTimezone(before), "Timezone");
          }}
          className="mt-2 h-12 w-full max-w-sm rounded-xl border border-line bg-bg-2 px-4 text-ink focus:border-gold"
        >
          {zoneOptions.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Motion</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["system", "Follow my device"],
              ["reduce", "Reduce motion"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={`${radio} border-line`}>
              <input
                type="radio"
                name="motion"
                className="sr-only"
                checked={motion === value}
                onChange={() => {
                  const before = motion;
                  setMotion(value);
                  void save({ motion: value }, () => setMotion(before), "Motion setting");
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Theme</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["night", "Night temple"],
              ["parchment", "Parchment"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={`${radio} border-line`}>
              <input type="radio" name="site-theme" className="sr-only" checked={siteTheme === value} onChange={() => applyTheme(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
