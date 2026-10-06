import Link from "next/link";
import type { Sloka } from "@/lib/types";
import { BindingHole, GoldDivider, Mandala, PalmLeafEdge } from "@/components/motifs";
import { Container, SectionHeading } from "@/components/ui";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

export function SlokaOfTheDay({ sloka }: { sloka: Sloka }) {
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date());
  return (
    <section id="sloka-of-the-day" aria-labelledby="sotd-title" className="relative overflow-hidden pb-4 pt-24 sm:pt-32">
      <div aria-hidden="true" data-parallax="0.35" className="pointer-events-none absolute -left-48 top-10 h-[28rem] w-[28rem] text-gold opacity-[0.08]">
        <Mandala variant="simple" className="h-full w-full" />
      </div>
      <Container>
        <SectionHeading id="sotd-title" eyebrow={`Sloka of the Day · ${today}`} title="One verse to carry today" lede="A new sloka every day, the same for everyone. Read it once in the morning; it will find you again by evening." />

        <article data-reveal className="relative mx-auto max-w-3xl">
          <PalmLeafEdge className="block h-3 w-full text-manuscript" />
          <div className="manuscript relative px-6 py-10 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)] sm:px-14 sm:py-14">
            <BindingHole className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7a5a2a] sm:left-7" />
            <BindingHole className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7a5a2a] sm:right-7" />
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b1e1e]">{sloka.reference.citation}</p>
              <FavoriteButton slug={sloka.slug} title={sloka.title} size="sm" className="!border-[#6b1e1e]/40 !text-[#6b1e1e]" />
            </div>
            <p className="deva mt-6 text-center text-[1.9rem] leading-[1.85] text-manuscript-ink sm:text-[2.6rem]" lang="sa">
              {sloka.devanagari.split("\n").map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </p>
            <p className="iast mt-6 text-center text-lg text-[#5a3a1c] sm:text-xl">
              {sloka.iast.split("\n").map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </p>
            <div className="mx-auto my-8 h-px w-24 bg-[#9a7a3a]/50" />
            <p className="display mx-auto max-w-xl text-center text-2xl leading-snug text-manuscript-ink sm:text-[1.7rem]">“{sloka.translation}”</p>
            <div className="mt-10 text-center">
              <Link
                href={`/sloka/${sloka.slug}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#6b1e1e] px-6 text-sm font-semibold tracking-wide text-[#f3e7cf] transition-transform hover:-translate-y-0.5 focus-visible:outline-[#6b1e1e]"
              >
                Word-by-word meaning <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <PalmLeafEdge flip className="block h-3 w-full text-manuscript" />
        </article>
      </Container>
      <GoldDivider className="mt-20" />
    </section>
  );
}
