import { Mandala } from "@/components/motifs";
import { ButtonLink, Eyebrow } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="temple-bg relative flex min-h-[80svh] items-center overflow-hidden pt-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <Mandala className="spin-slow aspect-square w-[120vw] max-w-[44rem] text-gold opacity-10" />
      </div>
      <div className="relative mx-auto max-w-xl px-5 text-center">
        <div className="flex justify-center">
          <Eyebrow>404 · Page not found</Eyebrow>
        </div>
        <p className="deva mt-6 text-4xl text-accent" lang="sa">
          असतो मा सद्गमय
        </p>
        <h1 className="display mt-4 text-5xl text-ink">This path leads nowhere real</h1>
        <p className="mt-4 text-ink-muted">Let us lead you back from the unreal to the real.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Return home</ButtonLink>
          <ButtonLink href="/library" variant="ghost">
            Browse the Library
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
