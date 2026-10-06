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
