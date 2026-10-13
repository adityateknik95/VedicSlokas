"use client";

import { useEffect } from "react";

/** Removes ?token= from the address bar and history as soon as the page has read it. */
export function StripToken() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("token")) {
      url.searchParams.delete("token");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
    }
  }, []);
  return null;
}
