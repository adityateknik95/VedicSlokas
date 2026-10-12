import translations from "@/data/translations.json";
import type { Sloka } from "./types";
import { transliterate, type Script } from "./transliterate";

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", script: "iast", scriptName: "Roman (IAST)", htmlLang: "en", scriptLang: "sa-Latn" },
  { code: "hi", name: "Hindi", native: "हिन्दी", script: "devanagari", scriptName: "Devanagari", htmlLang: "hi", scriptLang: "sa-Deva" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", script: "kannada", scriptName: "Kannada", htmlLang: "kn", scriptLang: "sa-Knda" },
  { code: "ta", name: "Tamil", native: "தமிழ்", script: "tamil", scriptName: "Tamil", htmlLang: "ta", scriptLang: "sa-Taml" },
  { code: "te", name: "Telugu", native: "తెలుగు", script: "telugu", scriptName: "Telugu", htmlLang: "te", scriptLang: "sa-Telu" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", script: "malayalam", scriptName: "Malayalam", htmlLang: "ml", scriptLang: "sa-Mlym" },
] as const;

export type Language = (typeof LANGUAGES)[number];
export type LangCode = Language["code"];

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
