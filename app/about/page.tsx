import type { Metadata } from "next";
import { Diya, GoldDivider, Mandala, Om } from "@/components/motifs";
import { ButtonLink, Container, Eyebrow, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Why VedicSlokas exists, how verses are chosen and checked, and a quick guide to reading IAST transliteration.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "Exact, or not at all",
    body: "Every sloka carries a precise reference: text, chapter and verse. If we are not sure of the wording or the number, the verse stays out. We never invent or “improve” a verse.",
  },
  {
    title: "Every word explained",
    body: "Sanskrit is compact. A single compound can hold a whole idea. So each verse comes apart word by word, and you can see how the meaning is built.",
  },
  {
    title: "Made to be said aloud",
    body: "These verses were heard long before they were written down. IAST transliteration and (soon) recordings help you pronounce them the way they were meant to sound.",
  },
];

const iast = [
  ["ā ī ū", "long vowels: father, machine, rule"],
  ["ṛ", "a vowel “ri”, as in kṛṣṇa (krishna)"],
  ["ś  ṣ", "two kinds of “sh”: śiva, kṛṣṇa"],
  ["c", "always “ch”, as in church"],
  ["ṭ ḍ ṇ", "tongue curled back (retroflex)"],
  ["ṃ", "anusvāra: a nasal hum"],
  ["ḥ", "visarga: a soft breath echoing the vowel"],
  ["ñ ṅ", "nasals: as in canyon, sing"],
];

export default function AboutPage() {
  return (
    <>
      <section className="temple-bg relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-44">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <div data-parallax="0.3" className="aspect-square w-[130vw] max-w-[52rem] text-gold opacity-[0.1]">
            <Mandala className="spin-slow h-full w-full" />
          </div>
        </div>
        <Container className="relative max-w-3xl text-center">
          <Diya className="mx-auto h-16 w-16" />
          <SectionHeading
            as="h1"
            eyebrow="About VedicSlokas"
            title="A lamp, passed hand to hand"
            lede="For more than three thousand years, these verses have travelled by voice from teacher to student. VedicSlokas is one more lamp in that line, lit for a generation that reads on phones."
          />
        </Container>
      </section>

      <section aria-labelledby="principles-title" className="py-16 sm:py-24">
        <Container>
          <SectionHeading id="principles-title" eyebrow="What we promise" title="Three simple principles" />
          <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
            {principles.map((p, i) => (
              <li key={p.title} data-reveal style={{ ["--i" as string]: i }} className="card p-7 sm:p-8">
                <span className="display text-5xl text-accent">0{i + 1}</span>
                <h3 className="display mt-4 text-3xl text-ink">{p.title}</h3>
                <p className="mt-3 text-ink-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <GoldDivider />

      <section aria-labelledby="iast-title" className="py-16 sm:py-24">
        <Container className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div data-reveal>
              <Eyebrow>Reading guide</Eyebrow>
            </div>
            <h2 id="iast-title" data-reveal style={{ ["--i" as string]: 1 }} className="display mt-4 text-4xl text-ink sm:text-5xl">
              How to read IAST
            </h2>
            <p data-reveal style={{ ["--i" as string]: 2 }} className="mt-5 text-ink-muted">
              IAST (the International Alphabet of Sanskrit Transliteration) writes every Devanagari sound with exactly one Roman letter or mark, so nothing is lost. A few marks do most of the work.
            </p>
            <p data-reveal style={{ ["--i" as string]: 3 }} className="mt-4 text-ink-muted">
              Don&apos;t worry about typing them: in our search, <span className="iast text-accent">krishna</span>, <span className="iast text-accent">krsna</span> and <span className="iast text-accent">kṛṣṇa</span> all find the same verses.
            </p>
          </div>
          <dl data-reveal className="manuscript grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-[1.25rem] p-7 sm:p-9">
            {iast.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="iast text-2xl text-[#6b1e1e]">{k}</dt>
                <dd className="self-center text-sm text-manuscript-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section aria-labelledby="accuracy-title" className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <div data-reveal className="relative overflow-hidden rounded-[1.25rem] border border-gold/40 bg-surface-2 p-8 sm:p-12">
            <Om className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-gold opacity-10" />
            <Eyebrow>A note on accuracy</Eyebrow>
            <h2 id="accuracy-title" className="display mt-4 text-3xl text-ink sm:text-4xl">
              Verified, verse by verse
            </h2>
            <p className="mt-4 text-ink-muted">
              Each verse is checked against a trusted critical edition before it is marked verified. Until then, its page shows
              <strong className="text-ink"> “Awaiting verification”</strong>. Printed editions sometimes differ in small spellings, especially for stotras;
              where we know of such variants, the context note says so.
            </p>
            <p className="mt-4 text-ink-muted">Translations are our own and aim for clarity over ornament. Found a mistake? We want to know.</p>
          </div>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/library">Explore the Library</ButtonLink>
            <ButtonLink href="/#sloka-of-the-day" variant="ghost">
              Today&apos;s sloka
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
