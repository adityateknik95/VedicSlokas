import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { Mandala } from "@/components/motifs";
import { Container, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Library",
  description: "Search and filter Sanskrit slokas by source, theme and deity. Search works in IAST, simple English spelling, and Devanagari.",
  alternates: { canonical: "/library" },
};

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  // Reading searchParams opts this page into per-request rendering, so a shared
  // link like /library?theme=courage arrives fully rendered.
  await searchParams;
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
        {/* Rendered on the server for each request (filters come from the URL), then hydrated: no client-only re-render of the grid. */}
        <Suspense>
          <LibraryBrowser />
        </Suspense>
      </Container>
    </div>
  );
}
