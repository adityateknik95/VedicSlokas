import type { Metadata } from "next";
import { Suspense } from "react";
import { Mandala } from "@/components/motifs";
import { Container, SectionHeading } from "@/components/ui";
import { TranslateFromUrl, TranslateView } from "@/components/translate/TranslateView";

export const metadata: Metadata = {
  title: "Translate",
  description:
    "Read any sloka in Kannada, Hindi, Tamil, Telugu, Malayalam or English: the Sanskrit in your own script, with its meaning in your language.",
  alternates: { canonical: "/translate" },
};

// Static and cached; the chosen sloka and language live in the URL (?sloka=…&lang=…).
export default function TranslatePage() {
  return (
    <div className="temple-bg relative overflow-hidden pb-10 pt-32 sm:pt-40">
      <div aria-hidden="true" data-parallax="0.3" className="pointer-events-none absolute -left-48 -top-24 h-[34rem] w-[34rem] text-gold opacity-[0.08]">
        <Mandala variant="simple" className="spin-slow h-full w-full" />
      </div>
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Translate"
          title="Read a sloka in your language"
          lede="Pick a sloka and a language. You'll see the Sanskrit written in that script, so you can recite it, and what it means."
        />
        <Suspense fallback={<TranslateView />}>
          <TranslateFromUrl />
        </Suspense>
      </Container>
    </div>
  );
}
