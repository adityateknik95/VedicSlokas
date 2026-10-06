"use client";

import { useEffect, type ReactNode } from "react";
import { LazyMotion, m } from "framer-motion";
import { loadMotionFeatures, whenIdle } from "@/lib/idle";
import { useReducedMotion } from "@/components/motion/MotionProvider";

// The first page a visitor lands on should paint immediately (good for LCP);
// every later navigation unrolls like a manuscript page.
let hasNavigated = false;

const unroll = [0.76, 0, 0.24, 1] as const;

export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const play = hasNavigated;

  useEffect(() => {
    hasNavigated = true;
    // Warm the animation features so the first navigation unrolls without waiting.
    return whenIdle(() => void loadMotionFeatures());
  }, []);

  if (!play) return <>{children}</>;

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      {reduced ? (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
          {children}
        </m.div>
      ) : (
        <>
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: unroll, delay: 0.25 }}>
            {children}
          </m.div>
          {/* Manuscript sheet that rolls away top-to-bottom, with a gold roller on its edge. */}
          <m.div
            aria-hidden="true"
            className="manuscript pointer-events-none fixed inset-0 z-40"
            initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(100% 0% 0% 0%)" }}
            transition={{ duration: 0.9, ease: unroll }}
          />
          <m.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-40 h-3 rounded-full"
            style={{
              background: "linear-gradient(180deg, #f3d488, #c9a24b 45%, #6b4a12)",
              boxShadow: "0 6px 18px rgb(0 0 0 / 0.35), 0 0 30px rgb(232 137 28 / 0.35)",
            }}
            initial={{ y: "0vh", opacity: 1 }}
            animate={{ y: "100vh", opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, ease: unroll }}
          />
        </>
      )}
    </LazyMotion>
  );
}
