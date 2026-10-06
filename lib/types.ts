export const SOURCES = ["Vedas", "Upanishads", "Bhagavad Gita", "Stotras"] as const;
export type Source = (typeof SOURCES)[number];

export const THEMES = ["courage", "peace", "knowledge", "devotion", "focus", "gratitude"] as const;
export type Theme = (typeof THEMES)[number];

export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface SourceReference {
  /** The text the verse comes from, e.g. "Ṛgveda", "Bhagavad Gītā". */
  text: string;
  /** Chapter / maṇḍala.sūkta / adhyāya.brāhmaṇa. Null for works without chapters. */
  chapter: string | null;
  verse: string;
  /** Human-readable citation, e.g. "Bhagavad Gītā 2.47". */
  citation: string;
}

export interface Sloka {
  id: number;
  slug: string;
  title: string;
  source: Source;
  reference: SourceReference;
  deity: string;
  themes: Theme[];
  /** One line used on cards. */
  essence: string;
  /** Lines separated by "\n". */
  devanagari: string;
  /** IAST transliteration, lines separated by "\n". */
  iast: string;
  words: WordMeaning[];
  translation: string;
  context: string;
  audio: string;
  featured: boolean;
  /** Must be checked against a trusted edition before launch. */
  verified: boolean;
}
