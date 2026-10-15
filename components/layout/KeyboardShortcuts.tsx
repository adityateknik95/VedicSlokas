"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export const SEARCH_INPUT_ID = "sloka-search";

/** "/" focuses the library search from anywhere on the site (the in-app library inside the dashboard). */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const inApp = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      e.preventDefault();
      const input = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      } else {
        router.push(inApp ? "/dashboard/library?focus=search" : "/library?focus=search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, inApp]);
  return null;
}
