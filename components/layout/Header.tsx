"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Diya } from "@/components/motifs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SurpriseButton } from "./SurpriseButton";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/library?favorites=1", label: "Favorites" },
  { href: "/about", label: "About" },
];

export function Header({ slugs }: { slugs: string[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]) && !href.includes("?"));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled || open ? "border-b border-line bg-bg/80 backdrop-blur-md" : "border-b border-transparent"
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
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="relative rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink aria-[current=page]:text-ink"
                >
                  {item.label}
                  {isActive(item.href) && <span aria-hidden="true" className="absolute inset-x-4 -bottom-0.5 h-px bg-gold" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <SurpriseButton slugs={slugs} />
          </span>
          <span className="sm:hidden">
            <SurpriseButton slugs={slugs} compact className="w-11 justify-center !px-0" />
          </span>
          <ThemeToggle />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
            </svg>
          </button>
        </div>
      </div>

      <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="border-t border-line bg-bg/95 backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-6xl flex-col px-5 py-3">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="display flex min-h-12 items-center border-b border-line/50 text-2xl text-ink last:border-0 aria-[current=page]:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
