import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/auth-schemas";
import { languageForPrefs, prefsForLanguage } from "@/lib/language-prefs";
import { hasRecitation } from "@/lib/recitation";
import { getSloka, getTextNeighbours, slokas } from "@/lib/slokas";

const sloka = (slug: string) => getSloka(slug)!;

describe("neighbours within a text", () => {
  it("orders verses numerically: 1.164 comes after 1.89", () => {
    expect(getTextNeighbours(sloka("rigveda-1-89-1")).next?.slug).toBe("rigveda-1-164-46");
    expect(getTextNeighbours(sloka("rigveda-1-164-46")).prev?.slug).toBe("rigveda-1-89-1");
  });

  it("walks the Gita in chapter order, 2.47 then 4.7, and 9.22 before 18.66", () => {
    expect(getTextNeighbours(sloka("bhagavad-gita-2-47")).next?.slug).toBe("bhagavad-gita-4-7");
    expect(getTextNeighbours(sloka("bhagavad-gita-18-66")).prev?.slug).toBe("bhagavad-gita-9-22");
  });

  it("never wraps around", () => {
    expect(getTextNeighbours(sloka("bhagavad-gita-2-14")).prev).toBeUndefined();
    expect(getTextNeighbours(sloka("bhagavad-gita-18-66")).next).toBeUndefined();
  });

  it("has no neighbours in a text we hold one verse of", () => {
    expect(getTextNeighbours(sloka("lingashtakam-1"))).toEqual({ prev: undefined, next: undefined });
  });

  it("never crosses into another text", () => {
    for (const s of slokas) {
      const { prev, next } = getTextNeighbours(s);
      for (const n of [prev, next]) if (n) expect(n.reference.text).toBe(s.reference.text);
    }
  });
});

describe("sign up", () => {
  it("needs only a valid email", () => {
    expect(signupSchema.safeParse({ email: "asha@example.com" }).success).toBe(true);
    expect(signupSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(signupSchema.safeParse({}).success).toBe(false);
  });
});

describe("reading language and account prefs", () => {
  it("English keeps Devanagari; other languages use their own script", () => {
    expect(prefsForLanguage("en")).toEqual({ script: "devanagari", meaningLang: "en" });
    expect(prefsForLanguage("hi")).toEqual({ script: "devanagari", meaningLang: "hi" });
    expect(prefsForLanguage("kn")).toEqual({ script: "kannada", meaningLang: "kn" });
  });

  it("maps every choice back to itself", () => {
    for (const code of ["en", "hi", "kn", "ta", "te", "ml"] as const) {
      const p = prefsForLanguage(code);
      expect(languageForPrefs(p.script, p.meaningLang)).toBe(code);
    }
  });

  it("reads an account with a script but English meanings as that script's language", () => {
    expect(languageForPrefs("tamil", "en")).toBe("ta");
    expect(languageForPrefs("iast", "en")).toBe("en");
  });
});

describe("recitations", () => {
  it("are reported only when the file exists", () => {
    expect(hasRecitation("/audio/README.md")).toBe(true);
    expect(hasRecitation("/audio/gayatri-mantra.mp3")).toBe(false);
  });
});
