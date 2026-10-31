import { LANGUAGES, type LangCode } from "@/lib/language-list";

/** The account's script and meaning language for a language choice. English readers keep Devanagari. */
export function prefsForLanguage(code: LangCode) {
  const lang = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  return { script: code === "en" ? ("devanagari" as const) : lang.script, meaningLang: code };
}

/** The other way: the one language that best describes an account's reading preferences. */
export function languageForPrefs(script: string, meaningLang: string): LangCode {
  const meaning = LANGUAGES.find((l) => l.code === meaningLang);
  if (meaning && meaning.code !== "en") return meaning.code;
  return LANGUAGES.find((l) => l.code !== "en" && l.script === script && l.script !== "devanagari")?.code ?? "en";
}
