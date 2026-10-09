import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { SlokaCard } from "@/components/library/SlokaCard";
import { Mandala } from "@/components/motifs";
import { Container, SectionHeading } from "@/components/ui";
import { slokas } from "@/lib/slokas";

export const metadata: Metadata = {
  title: "Library",
  description: "Search and filter Sanskrit slokas by source, theme and deity. Search works in IAST, simple English spelling, and Devanagari.",
  alternates: { canonical: "/library" },
};

// Static and CDN-cached, so links to the Library are prefetched and open instantly.
// Filters live in the URL and are applied in the browser by <LibraryBrowser>.
export default function LibraryPage() {
  return (
    <div className="temple-bg relative overflow-hidden pb-10 pt-32 sm:pt-40">
      <div aria-hidden="true" data-parallax="0.3" className="pointer-events-none absolute -right-48 -top-24 h-[34rem] w-[34rem] text-gold opacity-[0.08]">
        <Mandala variant="simple" className="spin-slow h-full w-full" />
      </div>
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="The Library"
          title="Every sloka, one search away"
          lede="Search in plain English, IAST, or Devanagari. “krishna” finds kṛṣṇa, “shiva” finds śiva."
        />
        <Suspense
          fallback={
            // Full list in the static HTML (first paint, crawlers); the interactive browser takes over on load.
            <ul className="mt-40 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {slokas.map((s, i) => (
                <li key={s.slug}>
                  <SlokaCard sloka={s} index={i} />
                </li>
              ))}
            </ul>
          }
        >
          <LibraryBrowser />
        </Suspense>
      </Container>
    </div>
  );
}
