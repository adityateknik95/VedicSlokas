"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Diya } from "@/components/motifs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { broadcastAuth } from "@/lib/auth-channel";
import { activeModule } from "@/lib/dashboard/modules";
import { SEARCH_INPUT_ID } from "@/components/layout/KeyboardShortcuts";
import { Avatar } from "./Avatar";
import { Popover } from "./Popover";

export type ShellUser = { name: string; email: string; image: string | null };

const TITLES: Record<string, string> = { "/dashboard/welcome": "Welcome" };

export function TopBar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();
  const title = TITLES[pathname] ?? activeModule(pathname)?.label ?? "Dashboard";

  const openSearch = () => {
    const input = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    } else router.push("/dashboard/library?focus=search");
  };

  const doSignOut = () =>
    startSignOut(async () => {
      await signOut();
      broadcastAuth("signed-out");
      window.dispatchEvent(new Event("vs-auth-change"));
      router.replace("/login?signedOut=1");
    });

  return (
    <header className="dash-topbar">
      <Link href="/dashboard" className="flex min-h-11 min-w-11 items-center justify-center md:hidden" aria-label="VedicSlokas dashboard home">
        <Diya className="h-8 w-8" />
      </Link>
      <p className="dash-title truncate" aria-hidden="true">
        {title}
      </p>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={openSearch}
          className="hidden h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-ink-muted transition-colors hover:border-gold hover:text-ink sm:inline-flex"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
          </svg>
          Search slokas
          <kbd aria-hidden="true" className="ml-2 rounded border border-line px-1.5 text-[0.7rem]">
            /
          </kbd>
        </button>
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search slokas"
          className="grid h-11 w-11 place-items-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
          </svg>
        </button>

        <ThemeToggle size="app" />

        <Popover
          label="Announcements"
          panelClassName="w-72 p-5"
          button={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" />
              <path d="M10 20.5a2 2 0 0 0 4 0" />
            </svg>
          }
        >
          {() => (
            <div className="text-center">
              <p className="deva text-2xl text-accent" lang="sa">
                शान्तिः
              </p>
              <p className="mt-2 text-sm text-ink">All quiet for now.</p>
              <p className="mt-1 text-xs text-ink-muted">Announcements will appear here.</p>
            </div>
          )}
        </Popover>

        <Popover label={`Account menu for ${user.name}`} panelClassName="w-72 p-2" button={<Avatar name={user.name} image={user.image} size="sm" />}>
          {(close) => (
            <div>
              <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
                <Avatar name={user.name} image={user.image} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                </div>
              </div>
              <ul className="mt-1">
                <li>
                  <Link href="/dashboard/settings" onClick={close} className="flex min-h-11 items-center rounded-xl px-3 text-sm text-ink hover:bg-surface-2">
                    Settings
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/progress" onClick={close} className="flex min-h-11 items-center rounded-xl px-3 text-sm text-ink hover:bg-surface-2">
                    Your progress
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={doSignOut} disabled={signingOut} className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-ink hover:bg-surface-2 disabled:opacity-60">
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </Popover>
      </div>
    </header>
  );
}
