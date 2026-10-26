"use client";

import Link from "next/link";
import { SlokaNote } from "./SlokaNote";
import { useSlokaAccount } from "./useSlokaAccount";

/**
 * Below the verse, for signed-in readers only: the verse in the script and language they
 * chose (marked as a draft where the translation isn't checked yet), and their private note.
 */
export function SlokaPersonal({ slug }: { slug: string }) {
  const state = useSlokaAccount(slug);
  if (!state) return null;
  const r = state.reading;
  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-4">
      {r && (
        <section aria-labelledby={`reading-${slug}`} className="dash-card p-5 text-left sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`reading-${slug}`} className="font-semibold text-ink">
              In your script
            </h2>
            <Link href="/dashboard/settings#reading" className="text-xs text-ink-muted underline-offset-4 hover:text-accent hover:underline">
              Script: {r.scriptName} · Meaning: {r.meaningName} · Change
            </Link>
          </div>
          {r.script !== "devanagari" && (
            <p lang={r.scriptLang} className={`mt-4 text-2xl leading-relaxed text-accent ${r.script === "iast" ? "iast" : ""}`}>
              {r.verse.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
          )}
          {r.meaningLang !== "en" && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-ink">{r.meaning}</p>
              {!r.meaningVerified && <p className="mt-2 text-xs text-ink-muted">Draft translation, not yet checked. The English meaning below is the reviewed one.</p>}
            </div>
          )}
        </section>
      )}
      <SlokaNote slug={slug} initial={state.note?.body ?? ""} />
    </div>
  );
}
