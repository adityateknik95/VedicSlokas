// Devanagari combining marks: candrabindu/anusvāra/visarga, nukta, vowel signs,
// virāma, Vedic accents and vocalic-l/ll signs. Avagraha (U+093D) is a base, not a mark.
const COMBINING = /[ऀ-ःऺ-़ा-ॏ॑-ॗॢॣ‌‍]/;
const VIRAMA = "्";

/**
 * Splits Devanagari into akṣaras (orthographic syllables) so a conjunct like
 * "त्र्य" or "न्नि" is never cut in half. A new unit starts at every base letter,
 * unless the previous letter ended in a virāma (which joins the conjunct).
 */
export function splitAksharas(text: string): string[] {
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    const prev = out[out.length - 1];
    if (prev !== undefined && (COMBINING.test(ch) || prev.endsWith(VIRAMA)) && ch !== " ") {
      out[out.length - 1] = prev + ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

/** Font-size class for a single Devanagari line on a card, so long compounds still fit. */
export function cardLineSize(line: string, base: string, long: string, veryLong: string) {
  const units = splitAksharas(line.replace(/\s+/g, "")).length;
  return units > 22 ? veryLong : units > 14 ? long : base;
}
