import type { Metadata } from "next";
import { SlokaOfTheDay } from "@/components/home/SlokaOfTheDay";
import { Descent } from "@/components/landing/Descent";
import { Elements } from "@/components/landing/Elements";
import { FinalCta } from "@/components/landing/FinalCta";
import { FindYourVerse } from "@/components/landing/FindYourVerse";
import { Hero } from "@/components/landing/Hero";
import { Streams } from "@/components/landing/Streams";
import { YourSpace } from "@/components/landing/YourSpace";
import { META } from "@/lib/landing-copy";
import { getSlokaOfTheDay } from "@/lib/slokas";
import { site } from "@/lib/site";

// Static, re-rendered hourly so the Sloka of the Day turns over at midnight UTC.
// Never read cookies() or headers() here: signed-in touches happen in client components.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: META.title },
  description: META.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title: META.title, description: META.description },
  twitter: { card: "summary_large_image", title: META.title, description: META.description },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: META.description,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${site.url}/library?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/icon.svg`,
      description: site.description,
    },
  ],
};

/**
 * The landing journey, from the universe to you:
 * space → the descent → the five elements → find your verse → four streams →
 * sloka of the day → your space → return to yourself.
 *
 * TODO(pricing): subscriptions and pricing are not part of this page yet.
 * TODO(booking): slot booking and the class timetable will join "Your space" once finalised.
 * TODO(courses): courses and new sloka content come later, from the content team.
 */
export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <Hero />
      <Descent />
      <Elements />
      <FindYourVerse />
      <Streams />
      <SlokaOfTheDay sloka={getSlokaOfTheDay()} />
      <YourSpace />
      <FinalCta />
    </>
  );
}
