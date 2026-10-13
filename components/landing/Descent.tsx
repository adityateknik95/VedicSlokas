import { Eyebrow } from "@/components/ui";
import { DESCENT_COPY, type DescentScene } from "@/lib/landing-copy";
import { DESCENT } from "@/lib/motion-tokens";
import { DescentMotion } from "./DescentMotion";
import { DescentStill } from "./DescentStill";
import { ScaleRail } from "./ScaleRail";

/** What each scene shows in the static version: frames rendered from the 3D scene, then the photos. */
const STILLS: Record<DescentScene["key"], string> = {
  cosmos: "/descent/still_cosmos.webp",
  star: "/descent/still_star.webp",
  earth: "/descent/still_earth.webp",
  nature: "/descent/nature_2400.webp",
  body: "/descent/body_2400.webp",
  self: "/descent/self_2400.webp",
};

/**
 * The signature moment: falling from the cosmos into one person and the light within.
 *
 * This server markup is the complete, accessible version: six real images stacked, each
 * with its caption. When motion is welcome and WebGL is available, DescentMotion upgrades
 * it (class .is-live) into a sticky stage: a real time 3D flight through a galaxy, past
 * the Sun and into the Earth's atmosphere, then photographs, all scrubbed by the scroll.
 */
export function Descent() {
  const scenes = DESCENT_COPY.scenes;
  return (
    <section
      id="descent"
      aria-labelledby="descent-title"
      className="descent cosmos cosmos-framed grain overflow-clip"
      style={{ ["--descent-track" as string]: `${DESCENT.trackSvh}svh` }}
    >
      {/* The threshold: the heading, in a short band of night where the real Milky Way (a strip
          of the same ESO panorama the dive opens on) thickens, and the hero's falling line
          carries on down to the hard edge where the descent begins. */}
      <header className="descent-threshold">
        <div aria-hidden="true" className="threshold-stars" />
        <div className="relative z-[2] px-5 text-center">
          <div data-reveal className="flex justify-center">
            <Eyebrow>{DESCENT_COPY.eyebrow}</Eyebrow>
          </div>
          <h2 id="descent-title" data-reveal style={{ ["--i" as string]: 1 }} className="display mx-auto mt-4 max-w-3xl text-4xl text-ink sm:text-5xl md:text-6xl">
            {DESCENT_COPY.title}
          </h2>
        </div>
        <div aria-hidden="true" className="threshold-line">
          <span className="cue-fall threshold-spark" />
        </div>
      </header>

      <div className="descent-track">
        <div className="descent-stage">

          <ol className="descent-scenes relative z-[2] px-5">
            {scenes.map((scene) => (
              <li key={scene.key} className="descent-scene">
                <DescentStill src={STILLS[scene.key]} alt={scene.alt} />
                <div className="descent-caption mt-8 px-5 text-center">
                  <p className="descent-scene-meta eyebrow mb-3 justify-center">
                    {scene.name} · {scene.gloss}
                  </p>
                  {/* Scrim: captions stay readable over the brightest scene. */}
                  <p className="display-lg mx-auto max-w-4xl text-ink [text-shadow:0_2px_24px_rgb(0_0_0/0.85),0_0_60px_rgb(0_0_0/0.6)]">{scene.caption}</p>
                </div>
              </li>
            ))}
          </ol>

          <ScaleRail scenes={scenes} />
          <p className="descent-loading" aria-hidden="true">
            {DESCENT_COPY.loading}
          </p>
        </div>
      </div>

      <p className="relative z-[2] mx-auto max-w-2xl px-5 pb-10 pt-4 text-center text-lg leading-relaxed text-ink-muted sm:text-xl">
        {DESCENT_COPY.closing}
      </p>

      {/* The CC BY images ask for visible credit. */}
      <footer className="relative z-[2] mx-auto max-w-3xl px-5 pb-20 text-center text-xs leading-relaxed text-ink-muted/80 sm:pb-28">
        <h3 className="sr-only">{DESCENT_COPY.creditsTitle}</h3>
        <p>
          {DESCENT_COPY.credits.map((credit, i) => (
            <span key={credit.href}>
              {credit.what}:{" "}
              <a href={credit.href} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
                {credit.who}
              </a>{" "}
              ({credit.licence}){i < DESCENT_COPY.credits.length - 1 ? ". " : "."}
            </span>
          ))}
        </p>
      </footer>

      <DescentMotion />
    </section>
  );
}
