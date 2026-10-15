"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Theme } from "@/lib/types";
import { browserTimeZone, failureMessage, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";
import { openSurprise } from "./surprise-events";

type ThemeChoice = { key: Theme; label: string; devanagari: string; blurb: string };

/**
 * First-run welcome: three short steps, every one skippable. Saves interests, the daily email
 * choice (off by default) and the browser's timezone, and marks onboarding as done.
 */
export function Onboarding({ firstName, themes, initialInterests }: { firstName: string; themes: ThemeChoice[]; initialInterests: Theme[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<Theme[]>(initialInterests);
  const [dailyEmail, setDailyEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  // Move focus to the new step's heading, but not on first load (and not twice in dev).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
  }, [step]);

  const save = async (): Promise<boolean> => {
    setSaving(true);
    try {
      await meFetch("/api/me/prefs", { method: "PATCH", body: { interests, dailyEmail, timezone: browserTimeZone(), onboarded: true } });
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
            <p className="mt-3 text-ink-muted">Pick any that feel close. We will lean Surprise me towards them. You can change this any time.</p>
            <fieldset className="mt-7">
              <legend className="sr-only">Themes you care about</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {themes.map((t) => {
                  const on = interests.includes(t.key);
                  return (
                    <label
                      key={t.key}
                      className={`flex min-h-[4.5rem] cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-flame ${
                        on ? "border-saffron bg-saffron/10" : "border-line hover:border-gold"
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(t.key)} />
                      <span lang="sa" aria-hidden="true" className="deva w-16 shrink-0 text-center text-xl text-accent">
                        {t.devanagari}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{t.label}</span>
                        <span className="block text-xs text-ink-muted">{t.blurb}</span>
                      </span>
                      <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${on ? "border-saffron bg-saffron text-on-saffron" : "border-line"}`}>
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
              A sloka in your inbox?
            </h1>
            <p className="mt-3 text-ink-muted">One short verse each morning, with its meaning. Off unless you turn it on, and easy to stop.</p>
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
          </>
        )}

        {step === 2 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="display text-4xl leading-tight text-ink outline-none sm:text-5xl">
              You&apos;re in.
            </h1>
            <p className="mt-3 text-ink-muted">Your favourites and progress now follow you to every device. Want to start with a surprise?</p>
            <p lang="sa" className="deva mt-8 text-center text-3xl text-accent">
              स्वागतम्
            </p>
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

