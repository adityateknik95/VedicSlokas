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

const loadDescent = () => import("./descent-3d");

/**
 * Upgrades the static descent into the real time 3D dive. Three.js, GSAP and the textures
 * load only after the visitor first scrolls, touches or moves the pointer, never on the
 * critical path. The switch happens only while the visitor is above the dive, so nobody
 * lands mid flight: a visitor who scrolled past before it was ready gets it as soon as they
 * scroll back above it. Reduced motion, Data Saver or no WebGL 2 keep the calm stacked
 * version.
 */
export function DescentMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = anchor.current?.closest("section");
    const track = section?.querySelector(".descent-track");
    if (!section || !track) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    let waitForTop: (() => void) | undefined;
    let code: ReturnType<typeof loadDescent> | undefined;
    // Probing WebGL creates a context, so it waits for the first interaction too.
    let capable: boolean | undefined;
    const able = () => (capable ??= canRun3D());
    const load = () => (code ??= loadDescent());

    const cancelFirst = onFirstInteraction(() => {
      if (!able()) return;
      void load().then(({ startDescent3D }) => {
        if (cancelled) return;
        const tryStart = () => {
          if (cancelled || track.getBoundingClientRect().top < 0) return false;
          waitForTop?.();
          stop = startDescent3D(section);
          return true;
        };
        if (tryStart()) return;
        const onScroll = () => void tryStart();
        window.addEventListener("scroll", onScroll, { passive: true });
        waitForTop = () => window.removeEventListener("scroll", onScroll);
      });
    });

    return () => {
      cancelled = true;
      cancelFirst();
      waitForTop?.();
      stop?.();
    };
  }, [reduced]);

  return <span ref={anchor} hidden />;
}
