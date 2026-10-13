"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/motion/MotionProvider";
import { onFirstInteraction } from "@/lib/idle";

type NetworkInfo = { saveData?: boolean };

function canRun3D(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  if (connection?.saveData) return false;
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Upgrades the static descent into the real time 3D dive. Three.js, GSAP and the textures
 * load only after the visitor first scrolls, touches or moves the pointer, never on the
 * critical path. The switch happens as long as the visitor has not scrolled past the
 * section's top; arriving deeper than that, with reduced motion, with Data Saver on or
 * without WebGL 2 keeps the calm stacked version.
 */
export function DescentMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = anchor.current?.closest("section");
    if (!section) return;
    let cancelled = false;
    let stop: (() => void) | undefined;

    const cancelFirst = onFirstInteraction(() => {
      void (async () => {
        if (!canRun3D()) return;
        const { startDescent3D } = await import("./descent-3d");
        // Upgrade unless the visitor is already inside the dive: its top edge (just below the
        // heading) stays put, so nothing above it moves, and nobody lands mid dive.
        const track = section.querySelector(".descent-track");
        if (cancelled || !track || track.getBoundingClientRect().top < 0) return;
        stop = startDescent3D(section);
      })();
    });

    return () => {
      cancelled = true;
      cancelFirst();
      stop?.();
    };
  }, [reduced]);

  return <span ref={anchor} hidden />;
}
