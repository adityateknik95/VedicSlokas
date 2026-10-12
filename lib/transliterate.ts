// Devanagari → other Indian scripts, for reading a Sanskrit sloka in one's own script.
//
// Kannada, Telugu and Malayalam Unicode blocks are laid out in parallel with
// Devanagari (same order, fixed offset), so those are a code-point shift with
// a few exceptions. Tamil lacks letters for aspirated and voiced stops, so it
// uses the widespread scholarly convention of superscript numerals:
// க¹ ka, க² kha, க³ ga, க⁴ gha (¹ is left unwritten).

export type Script = "devanagari" | "kannada" | "telugu" | "malayalam" | "tamil";

const DEVA_START = 0x0900;
const DEVA_END = 0x097f;
const OFFSET: Record<"kannada" | "telugu" | "malayalam", number> = {
  telugu: 0x0c00 - DEVA_START,
  kannada: 0x0c80 - DEVA_START,
  malayalam: 0x0d00 - DEVA_START,
};
// Shared across scripts; must not be shifted.
const KEEP = new Set(["।", "॥", "‌", "‍"]); // । ॥ ZWNJ ZWJ
const OM: Record<Script, string> = {
  devanagari: "ॐ",
  kannada: "ಓಂ",
  telugu: "ఓం",
  malayalam: "ഓം",
  tamil: "ஓம்",
};

function shift(text: string, script: "kannada" | "telugu" | "malayalam"): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (ch === "ॐ") out += OM[script];
    else if (KEEP.has(ch) || cp < DEVA_START || cp > DEVA_END) out += ch;
    else out += String.fromCodePoint(cp + OFFSET[script]);
  }
  return out;
}

// ───────────── Tamil ─────────────
const TA_CONSONANT: Record<string, [string, string]> = {
  क: ["க", ""], ख: ["க", "²"], ग: ["க", "³"], घ: ["க", "⁴"], ङ: ["ங", ""],
  च: ["ச", ""], छ: ["ச", "²"], ज: ["ஜ", ""], झ: ["ஜ", "²"], ञ: ["ஞ", ""],
  ट: ["ட", ""], ठ: ["ட", "²"], ड: ["ட", "³"], ढ: ["ட", "⁴"], ण: ["ண", ""],
  त: ["த", ""], थ: ["த", "²"], द: ["த", "³"], ध: ["த", "⁴"], न: ["ந", ""],
  प: ["ப", ""], फ: ["ப", "²"], ब: ["ப", "³"], भ: ["ப", "⁴"], म: ["ம", ""],
  य: ["ய", ""], र: ["ர", ""], ल: ["ல", ""], व: ["வ", ""], ळ: ["ள", ""],
  श: ["ஶ", ""], ष: ["ஷ", ""], स: ["ஸ", ""], ह: ["ஹ", ""],
};
const TA_VOWEL: Record<string, string> = {
  अ: "அ", आ: "ஆ", इ: "இ", ई: "ஈ", उ: "உ", ऊ: "ஊ", ऋ: "ரு'", ॠ: "ரூ'",
  ए: "ஏ", ऐ: "ஐ", ओ: "ஓ", औ: "ஔ",
};
const TA_SIGN: Record<string, string> = {
  "ा": "ா", "ि": "ி", "ी": "ீ", "ु": "ு", "ू": "ூ", "ृ": "்ரு'", "ॄ": "்ரூ'",
  "े": "ே", "ै": "ை", "ो": "ோ", "ौ": "ௌ", "्": "்",
};
const TA_OTHER: Record<string, string> = {
  "ं": "ம்", "ँ": "ம்", "ः": "꞉", "ऽ": "'", ॐ: OM.tamil,
};

function toTamil(text: string): string {
  const chars = Array.from(text);
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cons = TA_CONSONANT[ch];
    if (cons) {
      const [base, mark] = cons;
      const next = chars[i + 1];
      // The numeral follows the whole syllable: base + vowel sign/virama + numeral.
      if (next && TA_SIGN[next]) {
        out += base + TA_SIGN[next] + mark;
        i++;
      } else {
        out += base + mark;
      }
    } else if (TA_VOWEL[ch]) out += TA_VOWEL[ch];
    else if (TA_SIGN[ch]) out += TA_SIGN[ch];
    else if (TA_OTHER[ch]) out += TA_OTHER[ch];
    else out += ch;
  }
  return out;
}

export function transliterate(devanagari: string, script: Script): string {
  switch (script) {
    case "devanagari":
      return devanagari;
    case "tamil":
      return toTamil(devanagari);
    default:
      return shift(devanagari, script);
  }
}
