"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = { slugs: string[] };

/** Navigates to a random sloka other than the one on screen. Receives slugs only, to keep the data out of the client bundle. */
export function SurpriseButton({ slugs }: Props) {
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
      title="Surprise me"
      className="group inline-flex h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-0 text-sm font-medium text-ink transition-colors hover:bg-surface-2 md:h-10 md:min-w-10 2xl:px-4"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-flame transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" strokeLinejoin="round" />
      </svg>
      <span aria-hidden="true" className="hidden 2xl:inline">
        Surprise me
      </span>
    </button>
  );
}
