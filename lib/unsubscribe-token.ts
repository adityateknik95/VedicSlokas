import "server-only";
import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { authSecret } from "@/lib/env";

/**
 * One-click unsubscribe links: "<user id>.<signature>", signed with a key derived from
 * BETTER_AUTH_SECRET for this purpose only. They can only ever turn the daily email off.
 */

const key = () => Buffer.from(hkdfSync("sha256", authSecret(), "vedicslokas", "unsubscribe", 32));
const sign = (userId: string) => createHmac("sha256", key()).update(`unsubscribe:${userId}`).digest("base64url");

export function unsubscribeToken(userId: string): string {
  return `${Buffer.from(userId).toString("base64url")}.${sign(userId)}`;
}

/** The user id, or null for anything forged, altered or malformed. */
export function readUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token || token.length > 300) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  let userId: string;
  try {
    userId = Buffer.from(id, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = Buffer.from(sign(userId));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}
