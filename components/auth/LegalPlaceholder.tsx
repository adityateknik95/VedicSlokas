import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/ui";

/** Layout for the Terms and Privacy placeholders until the real documents are written. */
export function LegalPlaceholder({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="temple-bg pb-16 pt-32 sm:pt-40">
      <Container className="max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="display mt-4 text-5xl text-ink">{title}</h1>
        <div role="note" className="mt-8 rounded-2xl border border-saffron/60 bg-saffron/10 p-5 text-ink">
          <strong>Draft placeholder.</strong> This page must be written and reviewed by a qualified legal professional before VedicSlokas
          accepts students or payments.
        </div>
        <div className="mt-8 space-y-4 text-ink-muted">{children}</div>
      </Container>
    </div>
  );
}
