"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Diya } from "@/components/motifs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AccountLink } from "@/components/auth/AccountLink";
import { AuthSync } from "@/components/auth/AuthSync";

/**
 * The public header says what VedicSlokas is, not what buttons it has: each link opens a part
 * of the story on the landing page. The tools (library, favourites, translate, surprise)
 * live in the signed-in dashboard; guests still reach the library from the hero and footer.
 */
const NAV: { href: string; label: string }[] = [
  { href: "/#what-it-is", label: "What it is" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#texts", label: "The texts" },
  { href: "/#your-space", label: "Your space" },
  { href: "/about", label: "About" },
];

/**
 * Scrolls to the landing section a link points at. The browser's own jump is lost on a
 * fresh load of "/#section" (the page settles after it), and a click on a link to the
 * hash already in the address bar changes nothing, so the header does it itself.
 */
function scrollToSection(href: string) {
  const at = href.indexOf("#");
  const id = at === -1 ? "" : href.slice(at + 1);
  if (id) document.getElementById(decodeURIComponent(id))?.scrollIntoView({ block: "start" });
}

/** On the landing page, section links scroll in place; elsewhere they navigate as usual. */
const onSectionClick = (pathname: string, href: string) => () => {
  if (pathname === "/" && href.startsWith("/#")) scrollToSection(href);
};

/** The shared frosted-gold pill used by both the nav and the action group. */
const PILL =
  "rounded-full border border-gold/30 bg-bg-2/70 p-1 shadow-[inset_0_1px_0_rgb(243_231_207/0.06),0_12px_40px_-18px_var(--glow)] backdrop-blur-md";

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <ul className={`flex items-center gap-0.5 ${PILL}`}>
      {NAV.map((item) => {
        const on = item.href === pathname;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={on ? "page" : undefined}
              onClick={onSectionClick(pathname, item.href)}
              className={`relative flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-300 ${
                on
                  ? "bg-gradient-to-b from-saffron/25 to-gold/10 text-accent shadow-[inset_0_0_0_1px_rgb(201_162_75/0.45),0_0_22px_-6px_var(--glow)]"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Below laptop widths the same links sit behind a menu button, in a panel under the bar.
 * The panel is rendered by the header itself: the frosted action pill (backdrop-filter)
 * would otherwise become its containing block and squeeze it to the pill's width.
 */
function useCompactMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return { open, setOpen, button, panel };
}

type Menu = ReturnType<typeof useCompactMenu>;

function MenuButton({ menu }: { menu: Menu }) {
  return (
    <button
      ref={menu.button}
      type="button"
      aria-expanded={menu.open}
      aria-controls="site-menu"
      aria-label={menu.open ? "Close menu" : "Open menu"}
      onClick={() => menu.setOpen((o) => !o)}
      className="grid h-11 w-11 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink xl:hidden"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
        {menu.open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
      </svg>
    </button>
  );
}

function MenuPanel({ menu, pathname }: { menu: Menu; pathname: string }) {
  return (
    <div
      ref={menu.panel}
      id="site-menu"
      hidden={!menu.open}
      className="absolute inset-x-3 top-[calc(var(--nav-h)-0.25rem)] rounded-[1.4rem] border border-gold/30 bg-bg-2/95 p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)] backdrop-blur-lg sm:left-auto sm:right-6 sm:w-72 xl:hidden"
    >
      <nav aria-label="Primary">
        <ul>
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.href === pathname ? "page" : undefined}
                onClick={() => {
                  menu.setOpen(false);
                  onSectionClick(pathname, item.href)();
                }}
                className="flex min-h-12 items-center rounded-xl px-4 text-base text-ink hover:bg-surface-2 aria-[current=page]:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const menu = useCompactMenu();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    let timer = 0;
    // After load: until then the hydrating router and late layout (fonts, the descent stage)
    // undo or shift an earlier jump.
    const go = () => {
      timer = window.setTimeout(() => scrollToSection(hash), 60);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-500 ${
        scrolled ? "bg-bg/75 backdrop-blur-md" : ""
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-saffron focus:px-4 focus:py-2 focus:text-on-saffron">
        Skip to content
      </a>
      <div className="mx-auto grid h-[var(--nav-h)] max-w-[88rem] grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 xl:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 justify-self-start rounded-full" aria-label="VedicSlokas home">
          <Diya className="h-9 w-9" />
          <span className="display text-2xl tracking-wide text-ink">
            Vedic<span className="text-accent">Slokas</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden xl:block">
          <DesktopNav pathname={pathname} />
        </nav>

        <div className={`flex items-center gap-0.5 justify-self-end ${PILL}`}>
          <ThemeToggle />
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
          <AccountLink />
          <AuthSync />
          <MenuButton menu={menu} />
        </div>
      </div>
      <MenuPanel menu={menu} pathname={pathname} />
      {/* Gold hairline that appears once the page scrolls under the bar. */}
      <div
        aria-hidden="true"
        className={`h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />
    </header>
  );
}
