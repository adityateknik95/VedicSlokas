import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/ui";

/** Where people reach us about their data or these terms, until the site has its own domain. */
export const CONTACT_EMAIL = "adityateknik95@gmail.com";

/** Layout for the Privacy Policy and Terms: a title, the date, and numbered sections. */
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="temple-bg pb-16 pt-32 sm:pt-40">
      <Container className="max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="display mt-4 text-5xl text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated {updated}</p>
        <div className="mt-8 text-lg leading-relaxed text-ink">{intro}</div>
        <div className="legal mt-10 space-y-10 text-ink-muted [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_h2]:display [&_h2]:text-3xl [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
      </Container>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
