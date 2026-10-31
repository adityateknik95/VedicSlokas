/** The reading languages, with no verse data, so any client component can list them cheaply. */
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
