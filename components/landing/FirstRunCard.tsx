"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readFirstRun, writeFirstRun, type FirstRun } from "@/lib/first-run";
import { LANGUAGES } from "@/lib/language-list";
import { setReadingLanguage, useReadingLanguage } from "@/lib/reading-language";
import { useSignedInHint } from "@/lib/session-hint";
import { THEMES, type Theme } from "@/lib/types";

const THEME_LABEL: Record<Theme, string> = { courage: "Courage", peace: "Peace", knowledge: "Knowledge", devotion: "Devotion", focus: "Focus", gratitude: "Gratitude" };

const chip =
  "inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium text-ink-muted transition-colors hover:border-gold hover:text-ink aria-pressed:border-saffron aria-pressed:bg-saffron aria-pressed:text-on-saffron";

/**
 * A guest's first step, under the hero and easy to ignore: pick a language and a theme. The
 * verse above already follows the language; the theme becomes a way into the library.
 */
export function FirstRunCard() {
  const signedIn = useSignedInHint();
  const code = useReadingLanguage();
  const [state, setState] = useState<FirstRun | null>(null);
  useEffect(() => setState(readFirstRun()), []);

  if (signedIn !== false || !state || state.dismissed) return null;
  const update = (next: FirstRun) => {
    setState(next);
    writeFirstRun(next);
  };

  return (
    <section aria-labelledby="first-run-title" className="first-run-band relative z-[3] px-5 py-8 sm:px-8">
      <div className="relative mx-auto max-w-3xl rounded-[1.5rem] border border-gold/30 bg-bg-2/80 p-5 backdrop-blur-sm sm:p-7">
        <button
          type="button"
          onClick={() => update({ ...state, dismissed: true })}
          aria-label="Dismiss"
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-ink-muted hover:text-ink"
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2 id="first-run-title" className="display pr-10 text-2xl text-ink">
          Make it yours
        </h2>
        <fieldset className="mt-4">
          <legend className="eyebrow mb-2">Read in</legend>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.code} type="button" aria-pressed={code === l.code} aria-label={l.name} onClick={() => setReadingLanguage(l.code)} className={chip}>
                <span lang={l.htmlLang} className={l.code === "en" ? "" : l.code === "hi" ? "deva" : "indic"}>
                  {l.native}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="eyebrow mb-2">Looking for</legend>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button key={t} type="button" aria-pressed={state.theme === t} onClick={() => update({ ...state, theme: state.theme === t ? null : t })} className={chip}>
                {THEME_LABEL[t]}
              </button>
            ))}
          </div>
        </fieldset>
        {state.theme && (
          <p className="mt-5">
            <Link href={`/library?theme=${state.theme}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline">
              More on {THEME_LABEL[state.theme].toLowerCase()} <span aria-hidden="true">→</span>
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
