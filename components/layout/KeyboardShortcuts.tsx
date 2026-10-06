"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const SEARCH_INPUT_ID = "sloka-search";

/** "/" focuses the library search from anywhere on the site. */
export function KeyboardShortcuts() {
  const router = useRouter();
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
        router.push("/library?focus=search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
