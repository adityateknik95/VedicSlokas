import translations from "@/data/translations.json";
import type { Sloka } from "./types";
import { LANGUAGES, type LangCode, type Language } from "./language-list";
import { transliterate, type Script } from "./transliterate";

export { LANGUAGES, type Language, type LangCode } from "./language-list";

type Entry = { verified: boolean } & Record<Exclude<LangCode, "en">, string>;
const table = translations as Record<string, Entry>;

export function getLanguage(code: string | null | undefined): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

/** The sloka itself, written in the language's script (exact, rule-based). */
export function slokaInScript(sloka: Sloka, lang: Language): string {
  return lang.script === "iast" ? sloka.iast : transliterate(sloka.devanagari, lang.script as Script);
}

/** The meaning in that language. English is the reviewed source; the others are drafts until verified. */
export function meaningIn(sloka: Sloka, lang: Language): { text: string; verified: boolean } {
  if (lang.code === "en") return { text: sloka.translation, verified: sloka.verified };
  const entry = table[sloka.slug];
  return entry ? { text: entry[lang.code], verified: entry.verified } : { text: sloka.translation, verified: false };
}
