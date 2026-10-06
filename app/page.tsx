import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { SlokaOfTheDay } from "@/components/home/SlokaOfTheDay";
import { Pillars, type PillarData } from "@/components/home/Pillars";
import { CountUp } from "@/components/home/CountUp";
import { CarouselLazy } from "@/components/home/CarouselLazy";
import { GoldDivider, Lotus, Mandala, Om } from "@/components/motifs";
import { Container, SectionHeading } from "@/components/ui";
import { Tilt } from "@/components/ui/Tilt";
import { SOURCES, THEMES, deities, getFeatured, getSloka, getSlokaOfTheDay, slokas, sourceInfo, themeInfo } from "@/lib/slokas";

// Re-render hourly so the Sloka of the Day turns over at midnight UTC.
export const revalidate = 3600;

export default function HomePage() {
  const heroSloka = getSloka("brihadaranyaka-1-3-28")!;
  const quote = getSloka("rigveda-1-164-46")!;
  const today = getSlokaOfTheDay();

  const pillars: PillarData[] = SOURCES.map((source) => {
    const items = slokas.filter((s) => s.source === source);
    return {
      source,
      ...sourceInfo[source],
      count: items.length,
      examples: items.slice(0, 3).map((s) => ({ slug: s.slug, title: s.title, citation: s.reference.citation })),
    };
  });

  const carouselItems = getFeatured().map((s) => ({
    slug: s.slug,
    title: s.title,
    line: s.devanagari.split("\n")[0].replace(/[।॥]/g, "").trim(),
    citation: s.reference.citation,
    essence: s.essence,
  }));

  const stats = [
    { value: slokas.length, suffix: "", label: "Slokas, each with an exact source" },
    { value: SOURCES.length, suffix: "", label: "Great streams of Sanskrit" },
    { value: deities.length + THEMES.length, suffix: "", label: "Themes and deities to explore" },
    { value: 3000, suffix: "+", label: "Years of living, chanted tradition" },
  ];

  return (
    <>
      <Hero sloka={heroSloka} />

      <SlokaOfTheDay sloka={today} />

      {/* Four pillars */}
      <section aria-labelledby="pillars-title" className="defer-render relative py-20 sm:py-28">
        <Container>
          <SectionHeading
            id="pillars-title"
            eyebrow="Four streams, one river"
            title="Where the slokas come from"
            lede="From the hymns of the Vedic seers to the songs still sung in temples tonight. Tap a pillar to step inside."
          />
          <Pillars pillars={pillars} />
        </Container>
      </section>

      {/* Themes */}
      <section aria-labelledby="themes-title" className="defer-render relative overflow-hidden py-20 sm:py-28">
        <div aria-hidden="true" data-parallax="0.4" className="pointer-events-none absolute -right-40 top-0 h-[30rem] w-[30rem] text-saffron opacity-[0.07]">
          <Mandala variant="simple" className="h-full w-full" />
        </div>
        <Container>
          <SectionHeading id="themes-title" eyebrow="Browse by feeling" title="What do you need today?" lede="Every sloka is tagged by the moment it speaks to." />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {THEMES.map((t, i) => {
              const info = themeInfo[t];
              const count = slokas.filter((s) => s.themes.includes(t)).length;
              return (
                <li key={t} data-reveal style={{ ["--i" as string]: i }}>
                  <Tilt className="h-full">
                    <Link href={`/library?theme=${t}`} className="group flex h-full flex-col rounded-[1.25rem] p-5 sm:p-7">
                      <span className="deva text-[1.75rem] leading-tight text-accent sm:text-4xl" lang="sa">
                        {info.devanagari}
                      </span>
                      <span className="display mt-2 text-2xl text-ink sm:text-3xl">{info.label}</span>
                      <span className="mt-2 hidden flex-1 text-sm text-ink-muted sm:block">{info.blurb}</span>
                      <span className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-flame">
                        {count} slokas <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </Link>
                  </Tilt>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Stats */}
      <section aria-label="VedicSlokas in numbers" className="defer-render relative border-y border-line bg-charcoal/50 py-16 sm:py-20">
        <Container>
          <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} data-reveal style={{ ["--i" as string]: i }} className={`px-4 text-center ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="display block text-5xl text-accent sm:text-6xl">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </span>
                  <span aria-hidden="true" className="mx-auto mt-3 block max-w-[12rem] text-sm text-ink-muted">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Pull quote */}
      <section aria-label="Featured verse" className="defer-render relative overflow-hidden py-24 sm:py-36">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <div data-parallax="0.3" className="h-[36rem] w-[36rem] text-gold opacity-[0.07]">
            <Om className="h-full w-full" />
          </div>
        </div>
        <Container>
          <figure className="relative mx-auto max-w-4xl text-center">
            <Lotus className="mx-auto h-8 w-16 text-gold" />
            <blockquote className="mt-8">
              <p data-reveal className="deva text-[1.9rem] leading-[1.7] text-accent sm:text-5xl" lang="sa">
                एकं सद्विप्रा बहुधा वदन्ति
              </p>
              <p data-reveal style={{ ["--i" as string]: 1 }} className="display mt-8 text-4xl leading-tight text-ink sm:text-6xl">
                “Truth is one; the wise call it by many names.”
              </p>
            </blockquote>
            <figcaption data-reveal style={{ ["--i" as string]: 2 }} className="mt-8 text-sm uppercase tracking-[0.24em] text-ink-muted">
              <Link href={`/sloka/${quote.slug}`} className="hover:text-accent">
                {quote.reference.citation}
              </Link>
            </figcaption>
          </figure>
        </Container>
      </section>

      <GoldDivider />

      {/* Carousel */}
      <section aria-labelledby="carousel-title" className="defer-render relative overflow-hidden py-20 sm:py-28">
        <Container>
          <SectionHeading id="carousel-title" eyebrow="The wheel of verses" title="Turn the wheel" lede="Our most-loved slokas, arranged like lamps around a sanctum. Drag to turn; tap the one in front to open it." />
        </Container>
        <div data-reveal>
          <CarouselLazy items={carouselItems} />
        </div>
      </section>
    </>
  );
}
