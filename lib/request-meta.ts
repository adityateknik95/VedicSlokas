import "server-only";
import { headers } from "next/headers";

export type RequestMeta = { ip: string; userAgent: string | null };

/** Client IP and user agent for rate limiting and the audit log. */
export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  // On Vercel, x-forwarded-for is set by the platform; its first entry is the client.
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  return { ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}
