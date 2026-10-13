"use client";

import Link from "next/link";
import { useSignedInHint } from "@/lib/session-hint";

type Props = {
  guest: { href: string; label: string };
  member: { href: string; label: string };
  tone?: "primary" | "quiet";
  /** Fixed size so swapping the label after hydration never shifts layout. */
  className?: string;
};

const tones = {
  primary:
    "bg-saffron text-on-saffron shadow-[0_14px_40px_-12px_var(--glow)] hover:-translate-y-0.5 hover:bg-[#f39a33] hover:shadow-[0_18px_50px_-12px_var(--glow)]",
  quiet: "border border-line bg-bg/30 text-ink backdrop-blur-sm hover:-translate-y-0.5 hover:border-gold hover:bg-surface-2",
};

/** A call to action that reads "Begin" for guests and "Go to your dashboard" for members. */
export function AuthAwareCta({ guest, member, tone = "primary", className = "" }: Props) {
  const signedIn = useSignedInHint();
  const target = signedIn ? member : guest;
  return (
    <Link
      href={target.href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[0.95rem] font-semibold transition-all duration-300 ease-out-expo ${tones[tone]} ${className}`}
    >
      {target.label}
      {tone === "primary" && <span aria-hidden="true">→</span>}
    </Link>
  );
}
