import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoldDivider, Lotus, Mandala, PillarBorder } from "@/components/motifs";
import { Container, Eyebrow, ThemeTag } from "@/components/ui";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { AudioButton } from "@/components/sloka/AudioButton";
import { ShareActions } from "@/components/sloka/ShareActions";
import { StoryCard } from "@/components/sloka/StoryCard";
import { SlokaCard } from "@/components/library/SlokaCard";
import { getRelated, getSloka, slokas } from "@/lib/slokas";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return slokas.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/sloka/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = getSloka(slug);
  if (!s) return {};
  const description = `${s.essence} ${s.reference.citation}: Devanagari, IAST transliteration, word-by-word meaning and English translation.`;
  return {
    title: `${s.title} (${s.reference.citation})`,
    description,
    alternates: { canonical: `/sloka/${s.slug}` },
    openGraph: { type: "article", title: `${s.title} · ${s.reference.citation}`, description, url: `/sloka/${s.slug}` },
    twitter: { card: "summary_large_image", title: `${s.title} · ${s.reference.citation}`, description },
  };
}

export default async function SlokaPage({ params }: PageProps<"/sloka/[slug]">) {
  const { slug } = await params;
  const s = getSloka(slug);
  if (!s) notFound();

  const idx = slokas.findIndex((x) => x.slug === s.slug);
  const prev = slokas[(idx - 1 + slokas.length) % slokas.length];
  const next = slokas[(idx + 1) % slokas.length];
  const related = getRelated(s);
  const copyText = `${s.devanagari}\n\n${s.iast}\n\n“${s.translation}”\n— ${s.reference.citation}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quotation",
    name: s.title,
    text: s.devanagari.replace(/\n/g, " "),
    inLanguage: "sa",
    isPartOf: { "@type": "Book", name: s.reference.text },
    citation: s.reference.citation,
    url: `${site.url}/sloka/${s.slug}`,
  };

  return (
    <article className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Header + verse */}
      <header className="temple-bg relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <div data-parallax="0.25" className="aspect-square w-[130vw] max-w-[54rem] text-gold opacity-[0.12]">
            <Mandala className="spin-slow h-full w-full" />
          </div>
        </div>

        <Container className="relative">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/library" className="hover:text-accent">
                  Library
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/library?source=${encodeURIComponent(s.source)}`} className="hover:text-accent">
                  {s.source}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {s.title}
              </li>
            </ol>
          </nav>

          <div className="mt-10 text-center">
            <div className="flex justify-center">
              <Eyebrow>{s.reference.citation}</Eyebrow>
            </div>
            <h1 className="display mt-4 text-[2.6rem] text-ink sm:text-6xl md:text-7xl">{s.title}</h1>
          </div>

          <div className="relative mx-auto mt-12 max-w-4xl">
            <PillarBorder className="absolute -left-2 top-0 hidden h-full w-7 text-gold opacity-90 [filter:drop-shadow(0_0_6px_rgb(232_137_28/0.5))] md:block" />
            <PillarBorder className="absolute -right-2 top-0 hidden h-full w-7 text-gold opacity-90 [filter:drop-shadow(0_0_6px_rgb(232_137_28/0.5))] md:block" />
            <div className="px-0 py-4 text-center md:px-14">
              <p className="deva text-[1.85rem] leading-[1.9] text-ink [overflow-wrap:anywhere] sm:text-5xl sm:leading-[1.85]" lang="sa">
                {s.devanagari.split("\n").map((l, i) => (
                  <span key={i} className="block">
                    {l}
                  </span>
                ))}
              </p>
              <Lotus className="mx-auto my-8 h-7 w-14 text-gold" />
              <p className="iast text-xl leading-relaxed text-accent sm:text-2xl" lang="sa-Latn">
                {s.iast.split("\n").map((l, i) => (
                  <span key={i} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <AudioButton src={s.audio} title={s.title} />
            <FavoriteButton slug={s.slug} title={s.title} />
            <ShareActions title={s.title} text={copyText} path={`/sloka/${s.slug}`} />
          </div>
        </Container>
      </header>

      {/* Translation */}
      <section aria-labelledby="translation-title" className="py-16 sm:py-24">
        <Container className="max-w-4xl text-center">
          <div data-reveal className="flex justify-center">
            <Eyebrow>Translation</Eyebrow>
          </div>
          <h2 id="translation-title" className="sr-only">
            English translation
          </h2>
          <p data-reveal style={{ ["--i" as string]: 1 }} className="display mt-6 text-3xl leading-snug text-ink sm:text-5xl">
            “{s.translation}”
          </p>
          <div data-reveal style={{ ["--i" as string]: 2 }} className="mt-8 flex flex-wrap justify-center gap-2">
            {s.themes.map((t) => (
              <Link key={t} href={`/library?theme=${t}`} className="rounded-full">
                <ThemeTag>{t}</ThemeTag>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <GoldDivider />

      {/* Word by word */}
      <section aria-labelledby="words-title" className="defer-render py-16 sm:py-24">
        <Container className="max-w-5xl">
          <div className="mb-10 text-center">
            <div data-reveal className="flex justify-center">
              <Eyebrow>Pada-artha</Eyebrow>
            </div>
            <h2 id="words-title" data-reveal style={{ ["--i" as string]: 1 }} className="display mt-4 text-4xl text-ink sm:text-5xl">
              Word by word
            </h2>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.words.map((w, i) => (
              <div key={`${w.word}-${i}`} data-reveal style={{ ["--i" as string]: i % 6 }} className="rounded-2xl border border-line bg-surface p-5">
                <dt className="iast text-2xl text-accent" lang="sa-Latn">
                  {w.word}
                </dt>
                <dd className="mt-1 text-ink-muted">{w.meaning}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Context + source */}
      <section aria-labelledby="context-title" className="defer-render py-16 sm:py-20">
        <Container className="grid max-w-5xl gap-6 md:grid-cols-5">
          <div data-reveal className="rounded-[1.25rem] border border-line bg-surface-2 p-7 sm:p-10 md:col-span-3">
            <Eyebrow>Context</Eyebrow>
            <h2 id="context-title" className="display mt-3 text-3xl text-ink">
              The story behind it
            </h2>
            <p className="mt-4 text-ink-muted">{s.context}</p>
          </div>
          <aside data-reveal style={{ ["--i" as string]: 1 }} aria-labelledby="source-title" className="manuscript rounded-[1.25rem] p-7 sm:p-10 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b1e1e]">Source reference</p>
            <h2 id="source-title" className="display mt-3 text-3xl text-manuscript-ink">
              {s.reference.text}
            </h2>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              {s.reference.chapter && (
                <div>
                  <dt className="text-[#5a3a1c]">Chapter</dt>
                  <dd className="display text-2xl text-manuscript-ink">{s.reference.chapter}</dd>
                </div>
              )}
              <div>
                <dt className="text-[#5a3a1c]">Verse</dt>
                <dd className="display text-2xl text-manuscript-ink">{s.reference.verse}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#5a3a1c]">Deity / subject</dt>
                <dd className="text-manuscript-ink">{s.deity}</dd>
              </div>
            </dl>
            <p className={`mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${s.verified ? "bg-[#1f5130] text-[#f3e7cf]" : "bg-[#6b1e1e] text-[#f3e7cf]"}`}>
              <span aria-hidden="true">{s.verified ? "✓" : "○"}</span>
              {s.verified ? "Verified against a critical edition" : "Awaiting verification"}
            </p>
          </aside>
        </Container>
      </section>

      {/* Story card */}
      <section aria-label="Shareable story card" className="defer-render py-16 sm:py-24">
        <Container className="max-w-4xl">
          <div data-reveal>
            <StoryCard
              slug={s.slug}
              title={s.title}
              devanagari={s.devanagari}
              iast={s.iast}
              translation={s.translation}
              citation={s.reference.citation}
            />
          </div>
        </Container>
      </section>

      <GoldDivider />

      {/* Related + prev/next */}
      <section aria-labelledby="related-title" className="defer-render py-16 sm:py-24">
        <Container>
          <div className="mb-10 text-center">
            <div data-reveal className="flex justify-center">
              <Eyebrow>Keep reading</Eyebrow>
            </div>
            <h2 id="related-title" data-reveal style={{ ["--i" as string]: 1 }} className="display mt-4 text-4xl text-ink sm:text-5xl">
              Slokas that speak alike
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {related.map((r, i) => (
              <li key={r.slug}>
                <SlokaCard sloka={r} index={i} />
              </li>
            ))}
          </ul>

          <nav aria-label="Previous and next sloka" className="mt-14 grid gap-3 sm:grid-cols-2">
            <Link href={`/sloka/${prev.slug}`} className="group rounded-2xl border border-line p-5 transition-colors hover:border-gold">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">← Previous</span>
              <span className="display mt-1 block text-2xl text-ink group-hover:text-accent">{prev.title}</span>
            </Link>
            <Link href={`/sloka/${next.slug}`} className="group rounded-2xl border border-line p-5 text-right transition-colors hover:border-gold">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">Next →</span>
              <span className="display mt-1 block text-2xl text-ink group-hover:text-accent">{next.title}</span>
            </Link>
          </nav>
        </Container>
      </section>
    </article>
  );
}
