import { Mandala, Lotus, PillarBorder } from "@/components/motifs";
import { ButtonLink, Eyebrow } from "@/components/ui";
import type { Sloka } from "@/lib/types";
import { AksharaReveal } from "./AksharaReveal";
import { HeroFX } from "./HeroFX";

export function Hero({ sloka }: { sloka: Sloka }) {
  return (
    <section aria-labelledby="hero-title" className="temple-bg relative isolate flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28 sm:pt-32">
      {/* Mandala: slow constant spin (CSS) inside a wrapper that GSAP rotates further with scroll. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 grid place-items-center">
        <div data-scroll-rotate="140" className="relative aspect-square w-[150vw] max-w-[62rem] sm:w-[110vw]">
          <Mandala className="spin-slow absolute inset-0 h-full w-full text-gold opacity-[0.28]" />
          <Mandala variant="simple" className="spin-rev absolute inset-[22%] h-[56%] w-[56%] text-saffron opacity-[0.18]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(closest-side,transparent_35%,var(--bg)_100%)]" />
      </div>

      {/* Temple pillars framing the stage on larger screens. */}
      <div aria-hidden="true" data-parallax="0.15" className="pointer-events-none absolute inset-y-24 left-4 hidden w-8 text-gold opacity-40 lg:block xl:left-10">
        <PillarBorder className="h-full w-full" />
      </div>
      <div aria-hidden="true" data-parallax="0.15" className="pointer-events-none absolute inset-y-24 right-4 hidden w-8 text-gold opacity-40 lg:block xl:right-10">
        <PillarBorder className="h-full w-full" />
      </div>

      <HeroFX />

      <div className="relative mx-auto w-full max-w-4xl px-5 text-center sm:px-8">
        <div className="flex justify-center">
          <Eyebrow>Sanskrit for a new generation</Eyebrow>
        </div>

        <figure className="mt-8">
          <AksharaReveal text={sloka.devanagari} startMs={100} stepMs={45} className="text-[2rem] leading-[1.75] text-ink sm:text-5xl md:text-6xl" />
          <figcaption className="mx-auto mt-6 max-w-xl">
            <p className="iast text-lg text-accent sm:text-xl">
              {sloka.iast
                .replace(/ *\|+ */g, " ")
                .split("\n")
                .map((l) => l.trim())
                .join(" · ")}
            </p>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">
              “{sloka.translation}” <span className="whitespace-nowrap">· {sloka.reference.citation}</span>
            </p>
          </figcaption>
        </figure>

        <Lotus className="mx-auto mt-10 h-8 w-16 text-gold opacity-80" />

        <h1 id="hero-title" className="display mx-auto mt-6 max-w-3xl text-[2.6rem] text-ink sm:text-6xl md:text-7xl">
          The oldest words of wisdom, <em className="text-gold-sheen not-italic">lit for you.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted sm:text-lg">
          Luminous slokas from the Vedas, Upaniṣads, Gītā and stotras, with every word explained. Read one, say it aloud, carry it with you.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/library" className="w-full sm:w-auto">
            Explore Slokas
            <span aria-hidden="true">→</span>
          </ButtonLink>
          <ButtonLink href="#sloka-of-the-day" variant="ghost" className="w-full sm:w-auto">
            Sloka of the Day
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
