import { Container, SectionHeading } from "@/components/ui";
import { ELEMENTS_COPY } from "@/lib/landing-copy";
import { slokas } from "@/lib/slokas";
import type { Theme } from "@/lib/types";
import { ElementCard, type VersePreview } from "./ElementCard";

/** First verse in the data for a theme (featured ones preferred). */
function previewFor(theme: Theme): VersePreview | null {
  const pool = slokas.filter((s) => s.themes.includes(theme));
  const pick = pool.find((s) => s.featured) ?? pool[0];
  if (!pick) return null;
  return { slug: pick.slug, line: pick.devanagari.split("\n")[0].replace(/[।॥]/g, "").trim(), citation: pick.reference.citation };
}

/** Scene three: the five elements, each paired with a quality and a verse from the library. */
export function Elements() {
  return (
    <section id="elements" aria-labelledby="elements-title" className="defer-render relative overflow-hidden py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading id="elements-title" eyebrow={ELEMENTS_COPY.eyebrow} title={ELEMENTS_COPY.title} lede={ELEMENTS_COPY.lede} />
        <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ELEMENTS_COPY.items.map((item, i) => (
            <ElementCard key={item.key} item={item} verse={previewFor(item.theme)} index={i} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
