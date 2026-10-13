"use client";

import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { loadMotionFeatures, whenIdle } from "@/lib/idle";
import { useReducedMotion } from "@/components/motion/MotionProvider";

// The first page a visitor lands on should paint immediately (good for LCP);
// every later navigation unrolls like a manuscript page.
let hasNavigated = false;

const loadUnroll = () => import("@/components/motion/PageUnroll");
const PageUnroll = lazy(loadUnroll);

export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const play = hasNavigated;

  useEffect(() => {
    hasNavigated = true;
    // Warm the unroll (and framer-motion inside it) so the first navigation never waits.
    return whenIdle(() => void Promise.all([loadUnroll(), loadMotionFeatures()]));
  }, []);

  if (!play) return <>{children}</>;

  return (
    // If the code is somehow not warm yet, show the page straight away rather than wait.
    <Suspense fallback={children}>
      <PageUnroll reduced={reduced}>{children}</PageUnroll>
    </Suspense>
  );
}
