"use client";

import { useFavorites } from "@/lib/favorites";

type Props = { slug: string; title: string; size?: "sm" | "md"; className?: string };

export function FavoriteButton({ slug, title, size = "md", className = "" }: Props) {
  const { has, toggle } = useFavorites();
  const on = has(slug);
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
      title={on ? "Saved to favorites" : "Save to favorites"}
      className={`grid ${dim} shrink-0 place-items-center rounded-full border transition-all duration-300 ${
        on ? "border-saffron bg-saffron/15 text-flame" : "border-line text-ink-muted hover:border-gold hover:text-accent"
      } ${className}`}
    >
      {/* Lotus bud: filled when saved */}
      <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform duration-300 ${on ? "scale-110" : ""}`} fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3c2.6 2.8 3.6 6.2 0 11-3.6-4.8-2.6-8.2 0-11Z" />
        <path d="M12 14c1.2-3.6 4-6 7.5-6.5-.2 4.4-3 7-7.5 6.5ZM12 14c-1.2-3.6-4-6-7.5-6.5.2 4.4 3 7 7.5 6.5Z" />
        <path d="M5 18c4 2 10 2 14 0" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}
