/** Runs `cb` once the page has loaded and the main thread is idle, so non-essential work never competes with first paint. */
export function whenIdle(cb: () => void, timeout = 2500): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => !cancelled && cb(), { timeout });
    else timer = setTimeout(() => !cancelled && cb(), 200);
  };
  const onLoad = () => run();
  if (document.readyState === "complete") run();
  else window.addEventListener("load", onLoad, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", onLoad);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timer) clearTimeout(timer);
  };
}

export const loadMotionFeatures = () => import("./motion-features").then((m) => m.default);

/**
 * Runs `cb` on the visitor's first scroll, wheel, touch, pointer or key press.
 * For effects that only matter once someone starts moving (smooth scrolling,
 * scroll-linked motion), this keeps their code entirely off the load path.
 */
export function onFirstInteraction(cb: () => void): () => void {
  const events = ["wheel", "touchstart", "pointerdown", "pointermove", "keydown", "scroll"] as const;
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    off();
    cb();
  };
  const off = () => events.forEach((e) => window.removeEventListener(e, fire));
  events.forEach((e) => window.addEventListener(e, fire, { passive: true, once: true }));
  return () => {
    done = true;
    off();
  };
}
