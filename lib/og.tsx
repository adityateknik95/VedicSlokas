import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };

export async function ogFonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [cormorant, inter] = await Promise.all([
    readFile(join(dir, "CormorantGaramond-SemiBold.ttf")),
    readFile(join(dir, "Inter-Regular.ttf")),
  ]);
  return [
    { name: "Cormorant", data: cormorant, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: inter, weight: 400 as const, style: "normal" as const },
  ];
}

/** Line-art mandala for OG images (Satori-friendly SVG). */
export function OgMandala({ size = 760, opacity = 0.22 }: { size?: number; opacity?: number }) {
  const petals = (count: number, inner: number, outer: number, w: number) =>
    Array.from({ length: count }, (_, i) => {
      const mid = (inner + outer) / 2;
      return (
        <path
          key={`${count}-${i}`}
          d={`M0 ${-inner} Q ${w} ${-mid} 0 ${-outer} Q ${-w} ${-mid} 0 ${-inner} Z`}
          transform={`rotate(${(360 / count) * i})`}
        />
      );
    });
  return (
    <svg width={size} height={size} viewBox="-250 -250 500 500" style={{ opacity }}>
      <g fill="none" stroke="#C9A24B" strokeWidth="1">
        <circle r="18" />
        {petals(8, 18, 52, 14)}
        <circle r="58" />
        {petals(16, 58, 96, 11)}
        <circle r="100" />
        <circle r="116" />
        {petals(24, 116, 160, 13)}
        <circle r="166" />
        <circle r="190" />
        {petals(36, 190, 228, 10)}
        <circle r="244" />
      </g>
    </svg>
  );
}

// Deterministic star positions (a tiny LCG), so the share image never changes between builds.
const STARS = (() => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 90 }, () => ({ x: rand() * 1200, y: rand() * 630, r: 0.6 + rand() * 1.8, o: 0.25 + rand() * 0.65 }));
})();

/** The landing page's share card: the night sky, a mandala galaxy and "From the universe, to you." */
export function CosmosCard({ eyebrow, lead, tail, emphasis }: { eyebrow: string; lead: string; tail: string; emphasis: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(760px 520px at 50% 42%, #2b1d4a 0%, #120d2a 45%, #05040d 100%)",
        color: "#F3E7CF",
        position: "relative",
      }}
    >
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff6e4" fillOpacity={s.o} />
        ))}
      </svg>
      <div style={{ position: "absolute", display: "flex" }}>
        <OgMandala size={980} opacity={0.2} />
      </div>
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: 9999,
          display: "flex",
          background: "radial-gradient(circle, rgba(255,190,120,0.22), rgba(255,190,120,0) 70%)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontFamily: "Inter", fontSize: 22, letterSpacing: 8, textTransform: "uppercase", color: "#F0A04B" }}>{eyebrow}</div>
        <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 104, lineHeight: 1.05, marginTop: 22 }}>{lead}</div>
        <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 104, lineHeight: 1.05 }}>
          {tail}&nbsp;<span style={{ color: "#F0B35C" }}>{emphasis}</span>
        </div>
        <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 40, color: "#D9B45C", marginTop: 26 }}>
          Vedic<span style={{ color: "#F3E7CF" }}>Slokas</span>
        </div>
      </div>
    </div>
  );
}
