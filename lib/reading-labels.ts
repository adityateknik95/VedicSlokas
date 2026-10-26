import type { MeaningLang, ReadingScript } from "@/db/schema";

/** Names for the reading choices, safe for the browser bundle (no verse data). */
export const SCRIPT_LABELS: Record<ReadingScript, string> = {
  devanagari: "देवनागरी · Devanagari",
  kannada: "ಕನ್ನಡ · Kannada",
  telugu: "తెలుగు · Telugu",
  tamil: "தமிழ் · Tamil",
  malayalam: "മലയാളം · Malayalam",
  iast: "Roman (IAST)",
};

export const MEANING_LABELS: Record<MeaningLang, string> = {
  en: "English",
  hi: "हिन्दी · Hindi",
  kn: "ಕನ್ನಡ · Kannada",
  ta: "தமிழ் · Tamil",
  te: "తెలుగు · Telugu",
  ml: "മലയാളം · Malayalam",
};

/** 7 → "7:00 am", 0 → "12:00 am", 13 → "1:00 pm". */
export const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "am" : "pm"}`;
