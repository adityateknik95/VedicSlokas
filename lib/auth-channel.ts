"use client";

/**
 * Cross-tab auth signals (sign out everywhere, move on after sign-in).
 * Deliberately dependency-free: it's loaded on every page via the header.
 */
export const AUTH_CHANNEL = "vedicslokas-auth";
export type AuthMessage = { type: "signed-out" | "signed-in"; from: string };

/** Identifies this tab so it can ignore its own broadcasts. */
export const TAB_ID = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random());

export function broadcastAuth(type: AuthMessage["type"]): void {
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage({ type, from: TAB_ID } satisfies AuthMessage);
    channel.close();
  } catch {
    // BroadcastChannel unsupported: other tabs catch up on their next navigation.
  }
}
