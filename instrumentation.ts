/**
 * Runs once when a server instance starts and validates the environment, so a
 * misconfiguration is reported on boot rather than on a student's first sign-in.
 *
 * It reports instead of crashing: the public pages don't need auth secrets and must
 * keep working. Auth itself refuses to run until the variables are fixed (lib/env.ts
 * throws on first use).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./lib/env");
  try {
    env();
  } catch (error) {
    console.error(`[env] ${error instanceof Error ? error.message : String(error)}`);
  }
}
