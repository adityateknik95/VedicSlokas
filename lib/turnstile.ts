import "server-only";
import { env, isTurnstileEnabled } from "./env";

/**
 * Cloudflare Turnstile verification. Disabled by default (TURNSTILE_ENABLED=false),
 * in which case every request passes. Turn it on if bots start abusing the email forms.
 */
export async function verifyTurnstile(token: string | null | undefined, ip: string): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: env().TURNSTILE_SECRET_KEY ?? "", response: token, remoteip: ip });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
