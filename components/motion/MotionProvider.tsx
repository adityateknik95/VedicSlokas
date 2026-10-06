"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { onFirstInteraction } from "@/lib/idle";

const ReducedMotionContext = createContext(false);

export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Reveals [data-reveal] elements as they enter the viewport, including ones added later. */
function useRevealObserver(pathname: string) {
  useEffect(() => {
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const observe = (scope: ParentNode) =>
      scope.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));

    observe(document);
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches("[data-reveal]:not(.is-in)")) io.observe(n);
          observe(n);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    root.classList.add("reveal-ready");
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
}

type Gsap = typeof import("gsap").gsap;
type ST = typeof import("gsap/ScrollTrigger").ScrollTrigger;

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const gsapRef = useRef<{ gsap: Gsap; ScrollTrigger: ST } | null>(null);
  const [ready, setReady] = useState(false);
  const prevPath = useRef<string | null>(null);

  useRevealObserver(pathname);

  // Lazy-load Lenis + GSAP on the first scroll/touch/key: they only matter once the visitor
  // starts moving, so they never compete with first paint. Skipped entirely for reduced motion.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let tick: ((time: number) => void) | null = null;

    const cancelIdle = onFirstInteraction(async () => {
      const [{ default: LenisCtor }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new LenisCtor({ lerp: 0.1, anchors: { offset: -80 } });
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = lenis;
      gsapRef.current = { gsap, ScrollTrigger };
      setReady(true);
    });

    return () => {
      cancelled = true;
      cancelIdle();
      if (tick && gsapRef.current) gsapRef.current.gsap.ticker.remove(tick);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setReady(false);
    };
  }, [reduced]);

  // Scroll-linked effects for the current page: parallax motifs and scroll-driven rotation.
  useEffect(() => {
    if (!ready || reduced || !gsapRef.current) return;
    const { gsap, ScrollTrigger } = gsapRef.current;
    if (prevPath.current !== null && prevPath.current !== pathname && !window.location.hash) {
      lenisRef.current?.scrollTo(0, { immediate: true });
    }
    prevPath.current = pathname;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0.2");
        gsap.fromTo(
          el,
          { yPercent: -speed * 50 },
          {
            yPercent: speed * 50,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-scroll-rotate]").forEach((el) => {
        gsap.to(el, {
          rotate: parseFloat(el.dataset.scrollRotate || "90"),
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: 1 },
        });
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    const t = window.setTimeout(refresh, 800);
    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
  }, [ready, reduced, pathname]);

  return <ReducedMotionContext.Provider value={reduced}>{children}</ReducedMotionContext.Provider>;
}
