import * as Sentry from "@sentry/nextjs";

/**
 * Runs once when a server instance starts: starts error monitoring (when configured) and
 * validates the environment, so a misconfiguration is reported on boot rather than on a
 * student's first sign-in.
 *
 * The env check reports instead of crashing: the public pages don't need auth secrets and
 * must keep working. Auth itself refuses to run until the variables are fixed (lib/env.ts
 * throws on first use).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
    return;
  }
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./sentry.server.config");
  const { env } = await import("./lib/env");
  try {
    env();
  } catch (error) {
    console.error(`[env] ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Errors thrown while rendering or in route handlers, reported with their route. */
export const onRequestError = Sentry.captureRequestError;
