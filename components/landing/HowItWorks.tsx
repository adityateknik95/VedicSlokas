import Link from "next/link";
import type { ReactNode } from "react";
import { GoldDivider } from "@/components/motifs";
import { Container, SectionHeading } from "@/components/ui";
import { HOW_COPY } from "@/lib/landing-copy";
import { getSloka, slokas } from "@/lib/slokas";

/** The verse used to show the layers: real data, first half only. */
const EXAMPLE_SLUG = "bhagavad-gita-2-47";
const WORDS_SHOWN = 4;

/** Scene six: how a sloka page teaches, shown layer by layer on one real verse. */
export function HowItWorks() {
  const sloka = getSloka(EXAMPLE_SLUG) ?? slokas[0];
  const half = (text: string) => text.split("\n").slice(0, 2);

  const examples: ReactNode[] = [
    <p key="deva" lang="sa" className="deva text-2xl leading-relaxed text-accent sm:text-[1.7rem]">
      {half(sloka.devanagari).map((line) => (
        <span key={line} className="block">
          {line.replace(/[।॥]/g, "").trim()}
        </span>
      ))}
    </p>,
    <p key="iast" className="iast text-lg leading-relaxed text-ink">
      {half(sloka.iast).map((line) => (
        <span key={line} className="block">
          {line.replace(/\|/g, "").trim()}
        </span>
      ))}
    </p>,
    <div key="words">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {sloka.words.slice(0, WORDS_SHOWN).map((w) => (
          <div key={w.word} className="contents">
            <dt className="iast text-base text-accent">{w.word}</dt>
            <dd className="self-center text-ink-muted">{w.meaning}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-ink-muted">
        <span aria-hidden="true">… </span>
        {HOW_COPY.more}
      </p>
    </div>,
    <div key="meaning">
      <p className="display text-xl leading-snug text-ink">“{sloka.translation}”</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-flame">{sloka.reference.citation}</p>
    </div>,
  ];

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative overflow-hidden pb-4 pt-24 sm:pt-32">
      <Container>
        <SectionHeading id="how-title" eyebrow={HOW_COPY.eyebrow} title={HOW_COPY.title} lede={HOW_COPY.lede} />

        <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-5">
          {HOW_COPY.layers.map((layer, i) => (
            <li key={layer.title} data-reveal style={{ ["--i" as string]: i }} className="card flex flex-col p-6 sm:p-7">
              <div className="flex items-baseline gap-3">
                <span className="display text-4xl text-accent">0{i + 1}</span>
                <h3 className="display text-2xl text-ink">{layer.title}</h3>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{layer.body}</p>
              <div className="mt-5 flex-1 rounded-2xl border border-line bg-bg/40 p-5">{examples[i]}</div>
            </li>
          ))}
        </ol>

        <div data-reveal className="mx-auto mt-10 max-w-3xl rounded-[1.25rem] border border-gold/40 bg-surface-2 p-7 text-center sm:p-9">
          <h3 className="display text-2xl text-ink sm:text-3xl">{HOW_COPY.trustTitle}</h3>
          <p className="mt-3 text-ink-muted">{HOW_COPY.trustBody}</p>
          <Link href="/about" className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-flame hover:text-accent">
            {HOW_COPY.trustLink} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Container>
      <GoldDivider className="mt-20" />
    </section>
  );
}
