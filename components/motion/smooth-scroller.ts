import type Lenis from "lenis";

/**
 * The landing pages' Lenis instance while it is running, so code outside MotionProvider can
 * move the page through it. A plain window scroll would be undone by Lenis heading back to
 * its own target.
 */
let active: Lenis | null = null;

export const setSmoothScroller = (lenis: Lenis | null) => {
  active = lenis;
};

export const smoothScroller = () => active;
