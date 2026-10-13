import Link from "next/link";
import { Mandala } from "@/components/motifs";
import { Eyebrow } from "@/components/ui";
import { HERO } from "@/lib/landing-copy";
import { AuthAwareCta } from "./AuthAwareCta";
import { HeroSky, MotionToggle } from "./HeroClient";

/**
 * Scene one, "Space". The headline, line and buttons are plain server HTML so they paint
 * first; the starfield fades in once the page is idle. The mandala glows like a distant
 * galaxy and turns slowly.
 */
export function Hero() {
  const words = HERO.titleLead.split(" ");
  return (
    <section aria-labelledby="hero-title" className="hero-framed cosmos cosmos-framed grain relative flex min-h-[100svh] items-center overflow-hidden pb-40 pt-28 sm:pt-32 md:pb-24">
      <HeroSky />

      {/* Distant galaxy: a slow mandala with a warm core. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 grid place-items-center">
        <div className="relative aspect-square w-[150vw] max-w-[70rem] sm:w-[105vw]">
          <div className="breathe absolute inset-[30%] rounded-full bg-[radial-gradient(circle,rgb(255_190_120/0.28),rgb(140_70_200/0.12)_45%,transparent_70%)] blur-2xl" />
          <Mandala className="spin-slow absolute inset-0 h-full w-full text-gold opacity-[0.2]" />
          <Mandala variant="simple" className="spin-rev absolute inset-[24%] h-[52%] w-[52%] text-teal-300/40 opacity-60" />
        </div>
        {/* Scrim keeps text above 4.5:1 however bright the sky gets. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(4_3_12/0.55),rgb(4_3_12/0.15)_55%,rgb(4_3_12/0.7))]" />
      </div>

      <div className="relative z-[2] mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
        <div className="flex justify-center">
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
        </div>

        <h1 id="hero-title" className="display-xl mt-6 text-ink">
          <span className="block">
            {words.map((word, i) => (
              <span key={word} className="word-settle" style={{ ["--i" as string]: i }}>
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
          <span className="block">
            <span className="word-settle" style={{ ["--i" as string]: words.length }}>
              {HERO.titleTail}&nbsp;
            </span>
            <em className="word-settle text-gold-sheen not-italic" style={{ ["--i" as string]: words.length + 1 }}>
              {HERO.titleEmphasis}
            </em>
          </span>
        </h1>

        <p className="rise-in mx-auto mt-7 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg" style={{ ["--i" as string]: 3 }}>
          {HERO.lede}
        </p>

        <div className="rise-in mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ ["--i" as string]: 5 }}>
          <AuthAwareCta
            guest={{ href: "/signup", label: HERO.primary }}
            member={{ href: "/dashboard", label: HERO.primarySignedIn }}
            className="w-full sm:w-[17rem]"
          />
          <Link
            href="/library"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-line bg-bg/30 px-6 text-[0.95rem] font-semibold text-ink backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-surface-2 sm:w-auto"
          >
            {HERO.secondary}
          </Link>
        </div>
      </div>

      {/* Below md the bottom tab bar covers the last ~5rem, so the cue and pause sit above it. */}
      <div className="absolute inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[2] grid md:bottom-5 grid-cols-[1fr_auto] items-end gap-3 px-5 sm:grid-cols-[1fr_auto_1fr] sm:px-8">
        <span aria-hidden="true" className="hidden sm:block" />
        <a
          href="#descent"
          className="flex min-h-11 flex-col items-start gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-ink-muted transition-colors hover:text-ink sm:items-center"
        >
          {HERO.scrollCue}
          <span aria-hidden="true" className="relative h-9 w-px overflow-hidden bg-line">
            <span className="cue-fall absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-flame to-transparent" />
          </span>
        </a>
        <div className="justify-self-end">
          <MotionToggle />
        </div>
      </div>
    </section>
  );
}
