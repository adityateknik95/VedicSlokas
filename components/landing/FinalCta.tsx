import { Mandala } from "@/components/motifs";
import { FINAL_COPY } from "@/lib/landing-copy";
import { AuthAwareCta } from "./AuthAwareCta";

/** Scene eight: a calm return. The journey ends where it began, in the night sky. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="defer-render cosmos cosmos-framed grain star-dust relative overflow-hidden py-28 sm:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative aspect-square w-[150vw] max-w-[64rem] sm:w-[95vw]">
          <div className="breathe absolute inset-[32%] rounded-full bg-[radial-gradient(circle,rgb(255_190_120/0.25),transparent_70%)] blur-2xl" />
          <Mandala className="spin-slow absolute inset-0 h-full w-full text-gold opacity-[0.22]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(4_3_12/0.5),transparent_60%)]" />
      </div>

      <div className="relative z-[2] mx-auto max-w-3xl px-5 text-center">
        <h2 id="final-title" data-reveal className="display-xl text-ink">
          {FINAL_COPY.title}
        </h2>
        <p data-reveal style={{ ["--i" as string]: 1 }} className="mx-auto mt-6 max-w-md text-lg text-ink-muted">
          {FINAL_COPY.lede}
        </p>
        <div data-reveal style={{ ["--i" as string]: 2 }} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <AuthAwareCta guest={{ href: "/signup", label: FINAL_COPY.primary }} member={{ href: "/dashboard", label: FINAL_COPY.primarySignedIn }} className="w-full sm:w-[17rem]" />
          <AuthAwareCta
            tone="quiet"
            guest={{ href: "/login", label: FINAL_COPY.secondary }}
            member={{ href: "/library", label: FINAL_COPY.secondarySignedIn }}
            className="w-full sm:w-[17rem]"
          />
        </div>
      </div>
    </section>
  );
}
