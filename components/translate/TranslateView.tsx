"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SOURCES, getSloka, slokas } from "@/lib/slokas";
import { LANGUAGES, getLanguage, meaningIn, slokaInScript, type Language } from "@/lib/languages";

const DEFAULT_SLUG = "gayatri-mantra";
const DEFAULT_LANG = "kn";

/** Reads ?sloka= and ?lang= so any translation can be shared as a link. */
export function TranslateFromUrl() {
  const params = useSearchParams();
  return <TranslateView slug={params.get("sloka") ?? DEFAULT_SLUG} langCode={params.get("lang") ?? DEFAULT_LANG} />;
}

export function TranslateView({ slug: initialSlug = DEFAULT_SLUG, langCode = DEFAULT_LANG }: { slug?: string; langCode?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sloka = getSloka(initialSlug) ?? getSloka(DEFAULT_SLUG)!;
  const lang = getLanguage(langCode) ?? getLanguage(DEFAULT_LANG)!;
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (next: { sloka?: string; lang?: string }) => {
    const qs = new URLSearchParams({ sloka: next.sloka ?? sloka.slug, lang: next.lang ?? lang.code });
    router.replace(`${pathname}?${qs}`, { scroll: false });
  };

  const idx = slokas.findIndex((s) => s.slug === sloka.slug);
  const step = (d: 1 | -1) => go({ sloka: slokas[(idx + d + slokas.length) % slokas.length].slug });

  const script = slokaInScript(sloka, lang);
  const meaning = meaningIn(sloka, lang);
  const isIndic = lang.script !== "iast" && lang.script !== "devanagari";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${script}\n\n${meaning.text}\n— ${sloka.reference.citation}`);
      setCopied(`Copied in ${lang.name}`);
    } catch {
      setCopied("Couldn't copy on this device");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div>
      {/* Controls */}
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <label htmlFor="sloka-picker" className="eyebrow mb-3 block">
            Choose a sloka
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => step(-1)} aria-label="Previous sloka" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-accent">
              <span aria-hidden="true">←</span>
            </button>
            <select
              id="sloka-picker"
              value={sloka.slug}
              onChange={(e) => go({ sloka: e.target.value })}
              className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg-2 px-5 text-base text-ink focus:border-gold"
            >
              {SOURCES.map((src) => (
                <optgroup key={src} label={src}>
                  {slokas
                    .filter((s) => s.source === src)
                    .map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.title} · {s.reference.citation}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <button type="button" onClick={() => step(1)} aria-label="Next sloka" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-accent">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <fieldset>
          <legend className="eyebrow mb-3">Choose a language</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                aria-pressed={l.code === lang.code}
                onClick={() => go({ lang: l.code })}
                className="flex min-h-14 flex-col items-center justify-center rounded-2xl border border-line px-2 py-2 text-ink-muted transition-all hover:border-gold hover:text-ink aria-pressed:border-saffron aria-pressed:bg-saffron aria-pressed:text-on-saffron aria-pressed:shadow-[0_10px_30px_-12px_var(--glow)]"
              >
                <span lang={l.htmlLang} className={`text-lg leading-tight ${l.code === "en" ? "display" : l.code === "hi" ? "deva" : "indic"}`}>
                  {l.native}
                </span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] opacity-80">{l.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Result */}
      <article className="lamp-card card mx-auto mt-10 max-w-3xl p-6 sm:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--lamp-flame)]">{sloka.reference.citation}</p>
          <p className="display text-2xl text-[var(--lamp-ink)]">{sloka.title}</p>
        </div>

        <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lamp-muted)]">
          The sloka in {lang.scriptName} script
        </h2>
        <p
          lang={lang.scriptLang}
          className={`mt-3 text-center text-[var(--lamp-gold)] [overflow-wrap:anywhere] [text-shadow:0_0_18px_rgb(232_137_28/0.35)] ${
            lang.script === "iast" ? "iast text-2xl leading-relaxed sm:text-3xl" : lang.script === "devanagari" ? "deva text-[1.7rem] sm:text-4xl" : "indic text-[1.5rem] sm:text-[2rem]"
          }`}
        >
          {script.split("\n").map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </p>
        {lang.script === "tamil" && (
          <p className="mt-4 text-center text-xs text-[var(--lamp-muted)]">
            Tamil has no letters for some Sanskrit sounds, so small numbers mark them: க² = kha, க³ = ga, க⁴ = gha (the same for ச, ட, த, ப).
          </p>
        )}

        <div aria-hidden="true" className="mx-auto my-8 h-px w-28 bg-gradient-to-r from-transparent via-[#e2bf6a]/70 to-transparent" />

        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lamp-muted)]">Meaning in {lang.name}</h2>
        <p
          lang={lang.htmlLang}
          className={`mt-3 text-[var(--lamp-ink)] ${lang.code === "en" ? "display text-2xl leading-snug sm:text-[1.75rem]" : lang.code === "hi" ? "deva text-xl sm:text-2xl" : "indic text-lg sm:text-xl"}`}
        >
          {meaning.text}
        </p>
        {lang.code !== "en" && (
          <p className="mt-5 border-l-2 border-[#e2bf6a]/50 pl-4 text-sm italic text-[var(--lamp-muted)]">
            <span className="not-italic font-semibold uppercase tracking-[0.18em] text-[0.65rem]">English · </span>
            {sloka.translation}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#c9a24b]/40 pt-6">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-saffron px-5 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2.5" />
              <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
            </svg>
            Copy in {lang.name}
          </button>
          <Link
            href={`/sloka/${sloka.slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e2bf6a]/50 px-5 text-sm font-semibold text-[var(--lamp-gold)] hover:border-[#f4cf74]"
          >
            Word-by-word meaning <span aria-hidden="true">→</span>
          </Link>
          <p role="status" className="text-sm text-[var(--lamp-gold)] empty:hidden">
            {copied}
          </p>
        </div>

        {!meaning.verified && (
          <p className="mt-6 text-xs text-[var(--lamp-muted)]">
            {isIndic || lang.code === "hi" ? "The script version is exact. " : ""}
            {lang.code === "en" ? "This translation" : `The ${lang.name} meaning`} is awaiting review by a fluent reader.
          </p>
        )}
      </article>

      {/* All languages at a glance */}
      <section aria-labelledby="all-langs" className="mx-auto mt-14 max-w-3xl">
        <h2 id="all-langs" className="eyebrow mb-4">
          Meaning in all six languages
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-[1.25rem] border border-line">
          {LANGUAGES.map((l: Language) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => go({ lang: l.code })}
                aria-current={l.code === lang.code ? "true" : undefined}
                className="grid w-full gap-1 px-5 py-4 text-left transition-colors hover:bg-surface-2 aria-[current=true]:bg-surface-2 sm:grid-cols-[8rem_1fr] sm:gap-4"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-flame">{l.name}</span>
                <span lang={l.htmlLang} className={`text-ink ${l.code === "en" ? "" : l.code === "hi" ? "deva text-lg" : "indic"}`}>
                  {meaningIn(sloka, l).text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
