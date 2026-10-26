import type { MeaningLang, ReadingScript } from "@/db/schema";
import { getLanguage, LANGUAGES, meaningIn, slokaInScript } from "@/lib/languages";
import { MEANING_LABELS, SCRIPT_LABELS } from "@/lib/reading-labels";
import type { Sloka } from "@/lib/types";

/**
 * A verse the way this student reads: in their chosen script, with the meaning in their
 * chosen language. English meanings are the reviewed ones; the others are drafts until
 * checked, and say so.
 */
export type Reading = {
  script: ReadingScript;
  scriptName: string;
  /** BCP 47 tag for the verse text, e.g. "sa-Knda". */
  scriptLang: string;
  verse: string;
  meaningLang: MeaningLang;
  meaningName: string;
  meaning: string;
  /** False for a draft translation (anything not yet checked). */
  meaningVerified: boolean;
};

const byScript = (script: ReadingScript) => LANGUAGES.find((l) => l.script === script) ?? LANGUAGES[1];

export function readingFor(sloka: Sloka, script: ReadingScript, meaningLang: MeaningLang): Reading {
  const scriptLang = byScript(script);
  const lang = getLanguage(meaningLang) ?? LANGUAGES[0];
  const meaning = meaningIn(sloka, lang);
  return {
    script,
    scriptName: SCRIPT_LABELS[script],
    scriptLang: script === "devanagari" ? "sa" : scriptLang.scriptLang,
    verse: script === "devanagari" ? sloka.devanagari : slokaInScript(sloka, scriptLang),
    meaningLang,
    meaningName: MEANING_LABELS[meaningLang],
    meaning: meaning.text,
    meaningVerified: meaning.verified,
  };
}

/** True when the reader asked for anything other than the page's default (Devanagari, English). */
export const isPersonalised = (script: ReadingScript, meaningLang: MeaningLang) => script !== "devanagari" || meaningLang !== "en";
