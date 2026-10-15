"use client";

/** Any button can open Surprise me; the host lazily loads the reveal the first time. */
export const SURPRISE_EVENT = "vs-surprise:open";

export function openSurprise(): void {
  window.dispatchEvent(new Event(SURPRISE_EVENT));
}
