"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The current time, starting from the server's clock (so the first render matches the HTML)
 * and then ticking. `everyMs(now)` picks the next tick each time, so a page left open long
 * before a class speeds up to every second once the class is close, and slows down after.
 */
export function useNow(serverNow: number, everyMs: (now: number) => number): number {
  const [now, setNow] = useState(serverNow);
  const pick = useRef(everyMs);
  useEffect(() => {
    pick.current = everyMs;
  });

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      timer = window.setTimeout(tick, pick.current(t));
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}
