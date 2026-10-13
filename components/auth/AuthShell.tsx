import type { ReactNode } from "react";
import { Diya, Lotus, Mandala } from "@/components/motifs";
import { getSloka } from "@/lib/slokas";
import { site } from "@/lib/site";

/**
 * Two-column frame for every auth page: a lamp-lit brand panel with a sloka on the left,
 * the form card on the right. On phones it collapses to a short brand strip above the form.
 */
export function AuthShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  const sloka = getSloka("brihadaranyaka-1-3-28");
  const line = sloka?.devanagari.split("\n")[1]?.replace(/[।॥]/g, "").trim() ?? "तमसो मा ज्योतिर्गमय";

  return (
    <div className="temple-bg relative overflow-hidden pt-20 sm:pt-24">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl lg:grid-cols-2">
        {/* Brand panel */}
        <aside aria-label="VedicSlokas" className="relative flex items-center justify-center overflow-hidden px-6 py-8 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
            <Mandala className="spin-slow aspect-square w-[34rem] text-gold opacity-[0.16] lg:w-[44rem] lg:opacity-[0.22]" />
          </div>
          <div className="relative text-center">
            <Diya className="mx-auto hidden h-14 w-14 lg:block" />
            <p className="display text-xl text-ink-muted lg:mt-6 lg:text-2xl">{site.tagline}</p>
            <p lang="sa" className="deva lamp-breathe mt-4 hidden text-4xl text-accent lg:block xl:text-5xl">
              {line}
            </p>
            <p className="mt-3 hidden text-sm text-ink-muted lg:block">“Lead me from darkness to light.” · {sloka?.reference.citation}</p>
            <Lotus className="mx-auto mt-8 hidden h-7 w-14 text-gold lg:block" />
          </div>
        </aside>

        {/* Form panel */}
        <div className="relative flex items-start justify-center px-4 pb-16 sm:px-6 lg:items-center lg:py-16">
          <section className="card w-full max-w-md p-6 sm:p-9" aria-labelledby="auth-title">
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="auth-title" className="display mt-3 text-4xl text-ink sm:text-[2.75rem]">
              {title}
            </h1>
            <div className="mt-7">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
