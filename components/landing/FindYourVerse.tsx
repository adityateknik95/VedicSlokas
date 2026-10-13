import { Container, SectionHeading } from "@/components/ui";
import { MOOD_COPY } from "@/lib/landing-copy";
import { THEMES, slokas, themeInfo } from "@/lib/slokas";
import type { Theme } from "@/lib/types";
import { MoodPicker, type MoodOption, type MoodVerse } from "./MoodPicker";

/** Scene four: pick a feeling, get a verse. Works without an account. */
export function FindYourVerse() {
  const options: MoodOption[] = THEMES.map((theme) => ({ theme, label: MOOD_COPY.options[theme], devanagari: themeInfo[theme].devanagari }));
  // Each verse is sent once; themes point at it by index (most verses carry two themes).
  const verses = slokas.map<MoodVerse>((s) => ({ slug: s.slug, title: s.title, devanagari: s.devanagari, iast: s.iast, translation: s.translation, citation: s.reference.citation }));
  const byTheme = Object.fromEntries(THEMES.map((theme) => [theme, slokas.flatMap((s, i) => (s.themes.includes(theme) ? [i] : []))])) as Record<Theme, number[]>;

  return (
    <section aria-labelledby="mood-title" className="defer-render relative overflow-hidden py-24 sm:py-32">
      <Container>
        <SectionHeading id="mood-title" eyebrow={MOOD_COPY.eyebrow} title={MOOD_COPY.title} lede={MOOD_COPY.lede} />
        <MoodPicker options={options} verses={verses} byTheme={byTheme} />
      </Container>
    </section>
  );
}
