import { DESCENT_COPY, type DescentScene } from "@/lib/landing-copy";

/**
 * The slim vertical rail beside the descent: Brahmāṇḍa at the top, Piṇḍa at the bottom,
 * the current scene lit. Only shown in the live (scrubbed) version; the timeline marks the
 * active step directly (no React re-renders). Purely visual: every scene's name and
 * caption is already in the page for assistive tech.
 */
export function ScaleRail({ scenes }: { scenes: DescentScene[] }) {
  return (
    <div aria-hidden="true" className="descent-rail pointer-events-none absolute inset-y-0 right-3 z-[3] flex-col justify-center sm:right-8">
      <p className="mb-4 hidden text-right sm:block text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">{DESCENT_COPY.railTop}</p>
      <ol className="relative flex flex-col items-end gap-5 pr-[5px]">
        <span aria-hidden="true" className="absolute right-[8px] top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-gold/70 via-line to-gold/70" />
        {scenes.map((scene, i) => (
          <li key={scene.key} data-rail-step={i} data-active={i === 0 ? "true" : undefined} className="group relative flex items-center gap-3">
            <span className="text-right text-xs font-medium text-ink-muted transition-colors duration-500 group-data-[active=true]:text-ink">
              <span className="hidden sm:inline">{scene.name} </span>
              {/* On phones only the current scene is named, so the rail never covers the art. */}
              <span lang="sa" className="deva hidden group-data-[active=true]:inline sm:!hidden">
                {scene.devanagari}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="relative h-[7px] w-[7px] rounded-full bg-line transition-all duration-500 group-data-[active=true]:scale-[1.6] group-data-[active=true]:bg-flame group-data-[active=true]:shadow-[0_0_12px_3px_var(--glow)]"
            />
          </li>
        ))}
      </ol>
      <p className="mt-4 hidden text-right sm:block text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">{DESCENT_COPY.railBottom}</p>
    </div>
  );
}
