import type { Metadata } from "next";
import { TempleCarousel } from "@/components/about/TempleCarousel";
import { Container, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pilgrimage",
  description: "Four temples of South India, with links to their own websites.",
  alternates: { canonical: "/pilgrimage" },
};

export default function PilgrimagePage() {
  return (
    <div className="temple-bg relative overflow-hidden pb-10 pt-32 sm:pt-40">
      <Container className="max-w-3xl text-center">
        <SectionHeading as="h1" eyebrow="Pilgrimage" title="Temples to visit" lede="Four temples of South India. The links open each temple's own website." />
      </Container>
      <TempleCarousel />
    </div>
  );
}
