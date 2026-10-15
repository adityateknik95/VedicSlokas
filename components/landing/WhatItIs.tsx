import { Container, SectionHeading } from "@/components/ui";
import { WHAT_COPY } from "@/lib/landing-copy";
import { SOURCES, THEMES, slokas } from "@/lib/slokas";

/** Scene four: what the site is, who it is for and why it exists. Counts come from the data. */
export function WhatItIs() {
  const facts = WHAT_COPY.facts(slokas.length, SOURCES.length, THEMES.length);
  return (
    <section id="what-it-is" aria-labelledby="what-title" className="defer-render relative overflow-hidden py-24 sm:py-32">
      <Container>
        <SectionHeading id="what-title" eyebrow={WHAT_COPY.eyebrow} title={WHAT_COPY.title} lede={WHAT_COPY.lede} />

        <ul data-reveal aria-label="At a glance" className="mx-auto -mt-2 mb-12 flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
          {facts.map((fact) => (
            <li key={fact} className="rounded-full border border-gold/35 bg-surface px-4 py-2 text-sm text-ink">
              {fact}
            </li>
          ))}
        </ul>

        <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
          {WHAT_COPY.cards.map((card, i) => (
            <li key={card.title} data-reveal style={{ ["--i" as string]: i }} className="card p-7 sm:p-8">
              <h3 className="display text-3xl text-ink">{card.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">{card.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
