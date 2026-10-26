"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Goal, MeaningLang, ReadingScript } from "@/db/schema";
import { browserTimeZone, failureMessage, meFetch } from "@/lib/dashboard/client";
import { hourLabel, MEANING_LABELS, SCRIPT_LABELS } from "@/lib/reading-labels";
import { toast } from "@/lib/toast";
import { transliterate } from "@/lib/transliterate";
import type { Theme } from "@/lib/types";
import { openSurprise } from "./surprise-events";

type ThemeChoice = { key: Theme; label: string; devanagari: string; blurb: string };

const GOALS: { key: Goal; title: string; body: string }[] = [
  { key: "learn", title: "Learn what they mean", body: "Take each verse apart word by word." },
  { key: "recite", title: "Recite and chant", body: "Say them aloud, with the sounds right." },
  { key: "calm", title: "A moment of calm", body: "One verse a day to settle the mind." },
];
const SCRIPTS = Object.keys(SCRIPT_LABELS) as ReadingScript[];
const LANGS = Object.keys(MEANING_LABELS) as MeaningLang[];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const card = (on: boolean) =>
  `flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-flame ${
    on ? "border-saffron bg-saffron/10" : "border-line hover:border-gold"
  }`;
const mark = (on: boolean, round = true) =>
  `grid h-6 w-6 shrink-0 place-items-center ${round ? "rounded-full" : "rounded-md"} border text-xs ${on ? "border-saffron bg-saffron text-on-saffron" : "border-line"}`;

/**
 * First-run welcome: three short steps, every one skippable. Saves what brings them here
 * (goal and feelings), how they read (script and meaning language), and the daily email with
 * its time, plus the browser's timezone, and marks onboarding as done.
 */
export function Onboarding({
  firstName,
  themes,
  initialInterests,
  sample,
}: {
  firstName: string;
  themes: ThemeChoice[];
  initialInterests: Theme[];
  /** One line of a real verse, for the script preview. */
  sample: { devanagari: string; iast: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [interests, setInterests] = useState<Theme[]>(initialInterests);
  const [script, setScript] = useState<ReadingScript>("devanagari");
  const [meaningLang, setMeaningLang] = useState<MeaningLang>("en");
  const [dailyEmail, setDailyEmail] = useState(false);
  const [hour, setHour] = useState(7);
  const [saving, setSaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  // Move focus to the new step's heading, but not on first load (and not twice in dev).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
  }, [step]);

  const preview = (s: ReadingScript) => (s === "iast" ? sample.iast : s === "devanagari" ? sample.devanagari : transliterate(sample.devanagari, s));

  const save = async (): Promise<boolean> => {
    setSaving(true);
    try {
      await meFetch("/api/me/prefs", {
        method: "PATCH",
        body: { interests, goal, script, meaningLang, dailyEmail, reminderHour: dailyEmail ? hour : null, timezone: browserTimeZone(), onboarded: true },
      });
      return true;
    } catch (error) {
      toast(failureMessage(error, "save your choices"), { tone: "error" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const finish = async (thenSurprise: boolean) => {
    if (!(await save())) return;
    router.replace("/dashboard");
    router.refresh();
    if (thenSurprise) setTimeout(openSurprise, 400);
  };

  const toggle = (t: Theme) => setInterests((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]));

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-ink-muted" aria-live="polite">
        Step {step + 1} of 3
      </p>
      <div className="mt-3 flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-saffron" : "bg-line"}`} />
        ))}
      </div>

      <div key={step} className="dash-enter mt-8">
        {step === 0 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="display text-4xl leading-tight text-ink outline-none sm:text-5xl">
              Namaste, {firstName}. What brings you here?
            </h1>
            <p className="mt-3 text-ink-muted">We will shape your dashboard around it. You can change everything later in Settings.</p>
            <fieldset className="mt-7">
              <legend className="eyebrow mb-3">Your goal</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {GOALS.map((g) => (
                  <label key={g.key} className={`${card(goal === g.key)} min-h-[5.5rem] flex-col items-start justify-center gap-1`}>
                    <input type="radio" name="goal" className="sr-only" checked={goal === g.key} onChange={() => setGoal(g.key)} />
                    <span className="font-semibold text-ink">{g.title}</span>
                    <span className="text-xs text-ink-muted">{g.body}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-8">
              <legend className="eyebrow mb-3">Feelings you care about</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {themes.map((t) => {
                  const on = interests.includes(t.key);
                  return (
                    <label key={t.key} className={`${card(on)} min-h-[4.5rem]`}>
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(t.key)} />
                      <span lang="sa" aria-hidden="true" className="deva w-16 shrink-0 text-center text-xl text-accent">
                        {t.devanagari}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{t.label}</span>
                        <span className="block text-xs text-ink-muted">{t.blurb}</span>
                      </span>
                      <span aria-hidden="true" className={mark(on)}>
                        {on ? "✓" : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="display text-4xl leading-tight text-ink outline-none sm:text-5xl">
              How would you like to read?
            </h1>
            <p className="mt-3 text-ink-muted">Every verse can be shown in the script you read best, with its meaning in your language.</p>
            <fieldset className="mt-7">
              <legend className="eyebrow mb-3">Script</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {SCRIPTS.map((s) => (
                  <label key={s} className={`${card(script === s)} min-h-[4.5rem]`}>
                    <input type="radio" name="script" className="sr-only" checked={script === s} onChange={() => setScript(s)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{SCRIPT_LABELS[s]}</span>
                      <span aria-hidden="true" className={`mt-1 block truncate text-lg text-accent ${s === "iast" ? "iast" : ""}`}>
                        {preview(s)}
                      </span>
                    </span>
                    <span aria-hidden="true" className={mark(script === s)}>
                      {script === s ? "✓" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-8 block">
              <span className="eyebrow">Meaning in</span>
              <select value={meaningLang} onChange={(e) => setMeaningLang(e.target.value as MeaningLang)} className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink focus:border-gold sm:w-80">
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {MEANING_LABELS[l]}
                  </option>
                ))}
              </select>
              {meaningLang !== "en" && <span className="mt-2 block text-xs text-ink-muted">These translations are drafts while we check them; the reviewed English meaning is always on the page too.</span>}
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="display text-4xl leading-tight text-ink outline-none sm:text-5xl">
              A sloka in your inbox?
            </h1>
            <p className="mt-3 text-ink-muted">One short verse a day, in your script, at the time you choose. Off unless you turn it on, and one click to stop.</p>
            <label className="dash-card mt-7 flex min-h-[4.5rem] cursor-pointer items-center justify-between gap-4 px-5 py-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-flame">
              <span>
                <span className="block font-semibold text-ink">Email me the daily sloka</span>
                <span className="block text-xs text-ink-muted">We are setting this up now. If you opt in, your first one arrives when it starts.</span>
              </span>
              <input type="checkbox" role="switch" className="sr-only" checked={dailyEmail} onChange={(e) => setDailyEmail(e.target.checked)} />
              <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${dailyEmail ? "border-saffron bg-saffron" : "border-line bg-surface-2"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-transform duration-300 ${dailyEmail ? "translate-x-[1.35rem]" : "translate-x-0.5"}`} />
              </span>
            </label>
            {dailyEmail && (
              <label className="mt-4 block">
                <span className="eyebrow">At</span>
                <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className="mt-2 h-12 rounded-xl border border-line bg-surface px-4 text-ink focus:border-gold">
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
                <span className="ml-3 text-xs text-ink-muted">your time</span>
              </label>
            )}
            <p className="mt-8 text-ink-muted">That&apos;s it. Your favourites, notes and progress now follow you to every device.</p>
          </>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {step < 2 ? (
          <>
            <button type="button" onClick={() => setStep((s) => s + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5">
              Continue <span aria-hidden="true">→</span>
            </button>
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex min-h-12 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold">
                Back
              </button>
            )}
            <button type="button" onClick={() => void finish(false)} disabled={saving} className="ml-auto inline-flex min-h-12 items-center rounded-full px-4 text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-60">
              Skip for now
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => void finish(true)} disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5 disabled:opacity-60">
              Try Surprise me
            </button>
            <button type="button" onClick={() => void finish(false)} disabled={saving} className="inline-flex min-h-12 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold disabled:opacity-60">
              Go to my dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
