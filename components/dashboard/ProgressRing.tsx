import type { ReactNode } from "react";

/**
 * Animated progress ring with a real text alternative (role="img" and a label), so the number
 * is never conveyed by the drawing alone.
 */
export function ProgressRing({ value, total, label, size = 132, children }: { value: number; total: number; label: string; size?: number; children?: ReactNode }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6b25b" />
            <stop offset="100%" stopColor="#c9a24b" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share)}
          className="ring-draw"
          style={{ ["--ring-full" as string]: `${c}` }}
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
