import type { ReactNode } from "react";

type Tone = "error" | "info" | "success";

const tones: Record<Tone, string> = {
  error: "border-[#e0685a]/60 bg-[#e0685a]/10",
  info: "border-line bg-surface-2",
  success: "border-gold/60 bg-saffron/10",
};

/** Announced message box. Errors are assertive (role=alert); everything else is polite. */
export function FormMessage({ tone = "info", children, id }: { tone?: Tone; children: ReactNode; id?: string }) {
  return (
    <div id={id} role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm text-ink ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-muted">{label}</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
    </div>
  );
}
