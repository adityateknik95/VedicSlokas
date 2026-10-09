"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Diya } from "@/components/motifs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useFavorites } from "@/lib/favorites";
import { SurpriseButton } from "./SurpriseButton";

type NavKey = "home" | "library" | "favorites" | "about";

const icon = "h-[18px] w-[18px] shrink-0";
const ICONS: Record<NavKey, ReactNode> = {
  // Temple shikhara
  home: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2.5v1.5M12 4l-4.5 6h9L12 4Z" />
      <path d="M5.5 10h13M6.5 10v10.5h11V10" />
      <path d="M10 20.5v-5a2 2 0 0 1 4 0v5M4 20.5h16" />
    </svg>
  ),
  // Stack of palm-leaf manuscripts with a binding cord
  library: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="3.5" rx="1.75" />
      <rect x="3" y="10.25" width="18" height="3.5" rx="1.75" />
      <rect x="3" y="16" width="18" height="3.5" rx="1.75" />
      <path d="M8 3v18" />
    </svg>
  ),
  // Lotus
  favorites: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3.5c2.6 2.8 3.6 6.2 0 11-3.6-4.8-2.6-8.2 0-11Z" />
      <path d="M12 14.5c1.2-3.6 4-6 7.5-6.5-.2 4.4-3 7-7.5 6.5ZM12 14.5c-1.2-3.6-4-6-7.5-6.5.2 4.4 3 7 7.5 6.5Z" />
      <path d="M5 19c4 2 10 2 14 0" />
    </svg>
  ),
  // Diya
  about: (
    <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3c1.7 2.1 2.1 3.8 0 6.5-2.1-2.7-1.7-4.4 0-6.5Z" />
      <path d="M3.5 13c1.8 4.8 15.2 4.8 17 0Z" />
      <path d="M9 19.5h6" />
    </svg>
  ),
};

const NAV: { key: NavKey; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "library", href: "/library", label: "Library" },
  { key: "favorites", href: "/library?favorites=1", label: "Favorites" },
  { key: "about", href: "/about", label: "About" },
];

function activeKey(pathname: string, favorites: boolean): NavKey | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/library")) return favorites ? "favorites" : "library";
  if (pathname.startsWith("/about")) return "about";
  return null;
}

/** Reads ?favorites=1 so Favorites (a filtered Library view) lights up on its own. */
function useActiveKey() {
  const pathname = usePathname();
  const params = useSearchParams();
  return activeKey(pathname, params.get("favorites") === "1");
}

type NavProps = { active: NavKey | null };

/** Desktop: a floating pill, like a lamp-lit temple corridor. The active tab holds the flame. */
function DesktopNav({ active }: NavProps) {
  const { favorites } = useFavorites();
  return (
    <ul className="relative flex items-center gap-1 rounded-full border border-gold/30 bg-bg-2/70 p-1.5 shadow-[inset_0_1px_0_rgb(243_231_207/0.06),0_12px_40px_-18px_var(--glow)] backdrop-blur-md">
      {NAV.map((item) => {
        const on = active === item.key;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`group relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all duration-300 ${
                on
                  ? "bg-gradient-to-b from-saffron/25 to-gold/10 text-accent shadow-[inset_0_0_0_1px_rgb(201_162_75/0.45),0_0_22px_-6px_var(--glow)]"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className={`transition-transform duration-300 ${on ? "" : "group-hover:-translate-y-px"}`}>{ICONS[item.key]}</span>
              {item.label}
              {item.key === "favorites" && favorites.length > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-saffron px-1 text-[0.68rem] font-semibold text-on-saffron">
                  {favorites.length}
                  <span className="sr-only"> saved</span>
                </span>
              )}
              {on && (
                // The flame: a small glowing ember beneath the active tab.
                <span aria-hidden="true" className="absolute -bottom-[7px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-flame shadow-[0_0_10px_2px_var(--glow)]" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phones: an app-style dock at the bottom of the screen, within thumb reach. */
function MobileDock({ active }: NavProps) {
  const { favorites } = useFavorites();
  return (
    <ul className="grid grid-cols-4 gap-1 rounded-[1.6rem] border border-gold/30 bg-bg-2/85 p-1.5 shadow-[0_-8px_40px_-12px_rgb(0_0_0/0.5),0_0_30px_-14px_var(--glow)] backdrop-blur-lg">
      {NAV.map((item) => {
        const on = active === item.key;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.2rem] text-[0.7rem] font-medium tracking-wide transition-colors ${
                on ? "bg-gradient-to-b from-saffron/25 to-gold/10 text-accent shadow-[inset_0_0_0_1px_rgb(201_162_75/0.4)]" : "text-ink-muted active:bg-surface-2"
              }`}
            >
              <span className="relative">
                {ICONS[item.key]}
                {item.key === "favorites" && favorites.length > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-saffron px-1 text-[0.6rem] font-semibold text-on-saffron">
                    {favorites.length}
                    <span className="sr-only"> saved</span>
                  </span>
                )}
              </span>
              {item.label}
              {on && <span aria-hidden="true" className="absolute top-1 h-1 w-1 rounded-full bg-flame shadow-[0_0_8px_2px_var(--glow)]" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveDesktopNav() {
  return <DesktopNav active={useActiveKey()} />;
}
function ActiveMobileDock() {
  return <MobileDock active={useActiveKey()} />;
}

export function Header({ slugs }: { slugs: string[] }) {
  const pathname = usePathname();
  const fallbackActive = activeKey(pathname, false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-500 ${
          scrolled ? "bg-bg/75 backdrop-blur-md" : ""
        }`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-saffron focus:px-4 focus:py-2 focus:text-on-saffron">
          Skip to content
        </a>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:h-20 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-full" aria-label="VedicSlokas home">
            <Diya className="h-9 w-9" />
            <span className="display text-2xl tracking-wide text-ink">
              Vedic<span className="text-accent">Slokas</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <Suspense fallback={<DesktopNav active={fallbackActive} />}>
              <ActiveDesktopNav />
            </Suspense>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block">
              <SurpriseButton slugs={slugs} />
            </span>
            <span className="sm:hidden">
              <SurpriseButton slugs={slugs} compact className="w-11 justify-center !px-0" />
            </span>
            <ThemeToggle />
          </div>
        </div>
        {/* Gold hairline that appears once the page scrolls under the bar. */}
        <div
          aria-hidden="true"
          className={`h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
        />
      </header>

      <nav aria-label="Primary" className="fixed inset-x-3 bottom-3 z-50 pb-[env(safe-area-inset-bottom)] md:hidden">
        <Suspense fallback={<MobileDock active={fallbackActive} />}>
          <ActiveMobileDock />
        </Suspense>
      </nav>
    </>
  );
}
