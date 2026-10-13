/**
 * One motion language for the whole site. CSS mirrors these as custom properties in
 * app/globals.css (--ease-out-expo, --dur-enter, --stagger); keep the two in step.
 */

/** Entrances: fast start, long gentle settle. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** Ambient loops: slow in, slow out. */
export const EASE_IN_OUT_SINE = [0.37, 0, 0.63, 1] as const;

export const GSAP_EASE = {
  enter: "expo.out",
  ambient: "sine.inOut",
  /** Scroll-scrubbed motion follows the scrollbar 1:1 (smoothing comes from `scrub`). */
  scrub: "none",
  zoomIn: "power2.in",
  zoomOut: "power2.out",
} as const;

/** Seconds. */
export const DURATION = {
  enterShort: 0.7,
  enter: 0.9,
  enterLong: 1.1,
} as const;

/** Seconds between items in a staggered reveal. */
export const STAGGER = {
  tight: 0.04,
  base: 0.06,
  loose: 0.08,
} as const;

/** The pinned descent: how much scroll the whole dive takes, and how softly it follows the scrollbar. */
export const DESCENT = {
  /** Total scroll length of the dive, in small viewport heights. */
  trackSvh: 760,
  /** Seconds the camera lags behind the scrollbar (GSAP scrub smoothing). */
  scrub: 1.1,
} as const;
