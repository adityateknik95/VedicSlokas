"use client";

import { LANGUAGES, type LangCode } from "@/lib/language-list";
import { setReadingLanguage, useReadingLanguage } from "@/lib/reading-language";

/** One sloka in one language. Computed on the server, so the translations file stays out of the browser bundle. */
export type SlokaVersion = { verse: string; verseLang: string; meaning: string; meaningLang: string; verified: boolean };
export type SlokaVersions = Record<LangCode, SlokaVersion>;

const fontFor = (code: LangCode) => (code === "en" ? "" : code === "hi" ? "deva" : "indic");

/** Remembered for every page. Sits above the verse so reading in your own script is one tap, not a detour. */
export function LanguageToggle() {
  const code = useReadingLanguage();
  return (
    <div>
      <div role="group" aria-label="Reading language" className="flex flex-wrap items-center justify-center gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            aria-pressed={code === l.code}
            aria-label={l.name}
            onClick={() => setReadingLanguage(l.code)}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium text-ink-muted transition-colors hover:border-gold hover:text-ink aria-pressed:border-saffron aria-pressed:bg-saffron aria-pressed:text-on-saffron"
          >
            <span lang={l.htmlLang} className={fontFor(l.code)}>
              {l.native}
            </span>
          </button>
        ))}
      </div>
      {code !== "en" && <p className="mt-3 text-center text-xs text-ink-muted">Word by word and the story behind it are in English for now.</p>}
    </div>
  );
}

/** The large verse, in the reader's script. English readers see the Devanagari, as the static page does. */
export function SlokaVerse({ versions }: { versions: SlokaVersions }) {
  const code = useReadingLanguage();
  const v = versions[code];
  const deva = code === "en" || code === "hi";
  return (
    <p lang={v.verseLang} className={`text-ink [overflow-wrap:anywhere] ${deva ? "deva text-[1.85rem] leading-[1.9] sm:text-5xl sm:leading-[1.85]" : "indic text-[1.6rem] leading-[1.9] sm:text-[2.6rem] sm:leading-[1.8]"}`}>
      {v.verse.split("\n").map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </p>
  );
}

/** The meaning, in the reader's language. Unchecked translations say so and keep the reviewed English beside them. */
export function SlokaMeaning({ versions }: { versions: SlokaVersions }) {
  const code = useReadingLanguage();
  const v = versions[code];
  const draft = code !== "en" && !v.verified;
  return (
    <>
      <p lang={v.meaningLang} className={`mt-6 leading-snug text-ink ${code === "en" ? "display text-3xl sm:text-5xl" : `${fontFor(code)} text-2xl sm:text-4xl`}`}>
        “{v.meaning}”
      </p>
      {draft && (
        <div className="mx-auto mt-6 max-w-2xl">
          <p className="inline-flex rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-muted">Draft translation, not yet checked</p>
          <p className="mt-3 text-sm text-ink-muted">Reviewed English: “{versions.en.meaning}”</p>
        </div>
      )}
    </>
  );
}
