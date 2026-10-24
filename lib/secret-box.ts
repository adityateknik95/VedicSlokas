import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { authSecret } from "@/lib/env";

/**
 * Encrypts small secrets we must keep (a Google refresh token) with AES-256-GCM. The key is
 * derived from BETTER_AUTH_SECRET for this purpose only, so a database leak alone reveals
 * nothing. Format: "v1.<iv>.<tag>.<ciphertext>", base64url.
 */

const key = (purpose: string) => Buffer.from(hkdfSync("sha256", authSecret(), "vedicslokas", `secret-box:${purpose}`, 32));

export function seal(plain: string, purpose: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(purpose), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

/** Null when the value was tampered with, sealed for another purpose, or under another secret. */
export function open(sealed: string, purpose: string): string | null {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(purpose), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
