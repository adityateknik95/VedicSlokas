"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = { slugs: string[]; compact?: boolean; className?: string };

/** Navigates to a random sloka other than the one on screen. Receives slugs only, to keep the data out of the client bundle. */
export function SurpriseButton({ slugs, compact = false, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const surprise = () => {
    const current = pathname.startsWith("/sloka/") ? pathname.split("/")[2] : null;
    const pool = slugs.filter((s) => s !== current);
    router.push(`/sloka/${pool[Math.floor(Math.random() * pool.length)]}`);
  };

  return (
    <button
      type="button"
      onClick={surprise}
      aria-label="Surprise me with a random sloka"
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-all hover:border-gold hover:bg-surface-2 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-flame transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" strokeLinejoin="round" />
      </svg>
      <span className={compact ? "sr-only" : ""}>Surprise me</span>
    </button>
  );
}
