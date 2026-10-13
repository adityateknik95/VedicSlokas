"use client";

/**
 * The visitor's "Pause motion" choice. Stored per device, applied as html.motion-paused
 * (CSS freezes every ambient animation) and broadcast so canvases can stop too.
 */
const KEY = "vedicslokas:motion-paused";
export const MOTION_PAUSE_EVENT = "vs-motion-pause";

export function isMotionPaused(): boolean {
  return document.documentElement.classList.contains("motion-paused");
}

export function setMotionPaused(paused: boolean): void {
  document.documentElement.classList.toggle("motion-paused", paused);
  try {
    localStorage.setItem(KEY, paused ? "1" : "0");
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  window.dispatchEvent(new CustomEvent(MOTION_PAUSE_EVENT, { detail: paused }));
}

export function restoreMotionPause(): boolean {
  let paused = false;
  try {
    paused = localStorage.getItem(KEY) === "1";
  } catch {
    paused = false;
  }
  document.documentElement.classList.toggle("motion-paused", paused);
  return paused;
}
