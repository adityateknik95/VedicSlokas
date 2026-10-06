import data from "@/data/slokas.json";
import type { Sloka, Source, Theme } from "./types";
import { SOURCES, THEMES } from "./types";

export const slokas = data as Sloka[];

export function getSloka(slug: string): Sloka | undefined {
  return slokas.find((s) => s.slug === slug);
}

export function getFeatured(): Sloka[] {
  return slokas.filter((s) => s.featured);
}

export const deities: string[] = Array.from(new Set(slokas.map((s) => s.deity))).sort();

/** Same sloka for every visitor on a given calendar day (UTC). */
export function getSlokaOfTheDay(date = new Date()): Sloka {
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
  return slokas[day % slokas.length];
}

export function getRelated(sloka: Sloka, count = 3): Sloka[] {
  return slokas
    .filter((s) => s.slug !== sloka.slug)
    .map((s) => ({
      s,
      score: s.themes.filter((t) => sloka.themes.includes(t)).length * 2 + (s.source === sloka.source ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.s.id - b.s.id)
    .slice(0, count)
    .map(({ s }) => s);
}

/**
 * Folds IAST and everyday spellings onto one form, so "shiva", "śiva" and
 * "siva" all match, and "krishna" matches "kṛṣṇa".
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’‘|-]/g, " ")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    .replace(/ri/g, "r")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/w/g, "v")
    .replace(/\s+/g, " ")
    .trim();
}

const searchIndex = new Map<string, string>(
  slokas.map((s) => [
    s.slug,
    normalize(
      [
        s.title,
        s.iast,
        s.translation,
        s.essence,
        s.reference.citation,
        s.deity,
        s.themes.join(" "),
        s.words.map((w) => `${w.word} ${w.meaning}`).join(" "),
      ].join(" "),
    ) +
      " " +
      s.devanagari,
  ]),
);

export interface Filters {
  q?: string;
  source?: Source | "";
  theme?: Theme | "";
  deity?: string;
}

export function filterSlokas({ q = "", source = "", theme = "", deity = "" }: Filters): Sloka[] {
  const terms = normalize(q).split(" ").filter(Boolean);
  return slokas.filter((s) => {
    if (source && s.source !== source) return false;
    if (theme && !s.themes.includes(theme)) return false;
    if (deity && s.deity !== deity) return false;
    if (!terms.length) return true;
    const hay = searchIndex.get(s.slug)!;
    return terms.every((t) => hay.includes(t));
  });
}

export const sourceInfo: Record<Source, { devanagari: string; blurb: string; detail: string }> = {
  Vedas: {
    devanagari: "वेद",
    blurb: "The oldest hymns of humanity, sung by seers to fire, dawn and sky.",
    detail:
      "The four Vedas (Ṛg, Sāma, Yajur and Atharva) were passed down orally for millennia with extraordinary precision. Their hymns praise the forces of nature and ask the deepest questions about where everything came from.",
  },
  Upanishads: {
    devanagari: "उपनिषद्",
    blurb: "Conversations between teacher and seeker about the Self and the Real.",
    detail:
      "The Upaniṣads close the Vedic corpus and turn inward. In forest dialogues, teachers and students ask what we truly are, and answer that the Self within (ātman) and the ground of all (Brahman) are one.",
  },
  "Bhagavad Gita": {
    devanagari: "भगवद्गीता",
    blurb: "Kṛṣṇa's counsel to Arjuna on a battlefield: how to act, love and be free.",
    detail:
      "Seven hundred verses set in the Mahābhārata, as two armies face each other. Kṛṣṇa guides a despairing Arjuna through paths of action, knowledge and devotion. It is a handbook for living with courage.",
  },
  Stotras: {
    devanagari: "स्तोत्र",
    blurb: "Hymns of praise, made to be sung, from saints and poets across the ages.",
    detail:
      "Stotras are devotional poems with irresistible rhythm, many attributed to Ādi Śaṅkarācārya. They pair philosophy with music, which is why they are still sung in homes and temples every day.",
  },
};

export const themeInfo: Record<Theme, { devanagari: string; label: string; blurb: string }> = {
  courage: { devanagari: "शौर्य", label: "Courage", blurb: "For the days you need a spine of steel." },
  peace: { devanagari: "शान्ति", label: "Peace", blurb: "For when the mind won't stop racing." },
  knowledge: { devanagari: "ज्ञान", label: "Knowledge", blurb: "For the curious and the questioning." },
  devotion: { devanagari: "भक्ति", label: "Devotion", blurb: "For a heart that wants to bow." },
  focus: { devanagari: "एकाग्रता", label: "Focus", blurb: "For exam season, and every season." },
  gratitude: { devanagari: "कृतज्ञता", label: "Gratitude", blurb: "For noticing that you already have enough." },
};

export { SOURCES, THEMES };
