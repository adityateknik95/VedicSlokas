export { Mandala } from "./Mandala";

type SvgProps = { className?: string };

/** Lotus in line art. */
export function Lotus({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path pathLength={1} d="M60 6 C70 20 70 40 60 56 C50 40 50 20 60 6 Z" />
      <path pathLength={1} d="M60 56 C64 38 76 24 92 18 C90 36 80 50 60 56 Z" />
      <path pathLength={1} d="M60 56 C56 38 44 24 28 18 C30 36 40 50 60 56 Z" />
      <path pathLength={1} d="M60 56 C76 46 96 42 114 46 C100 56 80 60 60 56 Z" />
      <path pathLength={1} d="M60 56 C44 46 24 42 6 46 C20 56 40 60 60 56 Z" />
      <path pathLength={1} d="M30 60 H90" />
    </svg>
  );
}

/** Gold divider that draws itself when it scrolls into view. */
export function GoldDivider({ className = "" }: SvgProps) {
  return (
    <div data-reveal className={`mx-auto flex w-full max-w-md items-center justify-center text-gold ${className}`}>
      <svg viewBox="0 0 400 40" className="draw h-8 w-full" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <line pathLength={1} x1="4" y1="20" x2="170" y2="20" />
        <line pathLength={1} x1="230" y1="20" x2="396" y2="20" />
        <path pathLength={1} d="M200 6 L214 20 L200 34 L186 20 Z" />
        <path pathLength={1} d="M200 12 L208 20 L200 28 L192 20 Z" />
        <circle pathLength={1} cx="176" cy="20" r="2.5" />
        <circle pathLength={1} cx="224" cy="20" r="2.5" />
        <path pathLength={1} d="M120 20 C135 10 150 10 160 20 C150 30 135 30 120 20" />
        <path pathLength={1} d="M280 20 C265 10 250 10 240 20 C250 30 265 30 280 20" />
      </svg>
    </div>
  );
}

/** A diya (oil lamp) whose flame flickers. */
export function Diya({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="diya-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e8891c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="diya-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e8891c" />
          <stop offset="60%" stopColor="#ffc35a" />
          <stop offset="100%" stopColor="#fff3d6" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="22" r="18" fill="url(#diya-glow)" />
      <path className="flicker" d="M32 6 C37 14 39 20 32 30 C25 20 27 14 32 6 Z" fill="url(#diya-flame)" />
      <path d="M8 36 C14 50 50 50 56 36 Z" fill="#c9a24b" />
      <path d="M8 36 C14 50 50 50 56 36" fill="none" stroke="#6b1e1e" strokeWidth="1.5" />
      <path d="M20 46 C24 52 40 52 44 46" fill="none" stroke="#c9a24b" strokeWidth="2" />
      <ellipse cx="32" cy="36" rx="24" ry="3" fill="#8a6a26" />
    </svg>
  );
}

/** Om, set in the Devanagari face inside an SVG so it can scale like a motif. */
export function Om({ className, title }: SvgProps & { title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title} focusable="false">
      <text x="50" y="72" textAnchor="middle" fontSize="78" fill="currentColor" style={{ fontFamily: "var(--font-tiro), serif" }}>
        ॐ
      </text>
    </svg>
  );
}

/** Vertical temple pillar: capital, fluted shaft, base. Stretches to its container's height. */
export function PillarBorder({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 40 400" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M2 4 H38 M6 10 H34 M4 16 H36" vectorEffect="non-scaling-stroke" />
      <path d="M10 16 C10 24 30 24 30 16" vectorEffect="non-scaling-stroke" />
      <path d="M12 24 V376 M20 24 V376 M28 24 V376" vectorEffect="non-scaling-stroke" opacity="0.7" />
      <path d="M8 24 V376 M32 24 V376" vectorEffect="non-scaling-stroke" />
      <path d="M10 384 C10 376 30 376 30 384" vectorEffect="non-scaling-stroke" />
      <path d="M4 384 H36 M6 390 H34 M2 396 H38" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Palm-leaf manuscript edge: a soft, irregular border with two binding holes. Place at top or bottom of a manuscript surface. */
export function PalmLeafEdge({ className, flip = false }: SvgProps & { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 600 16"
      preserveAspectRatio="none"
      className={className}
      style={flip ? { transform: "scaleY(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 16 V7 C40 4 60 9 100 6 C140 3 170 8 210 6 C250 4 280 9 320 6 C360 3 400 8 440 5 C480 3 520 8 560 6 C580 5 590 6 600 7 V16 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Binding hole on a palm-leaf manuscript. */
export function BindingHole({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
