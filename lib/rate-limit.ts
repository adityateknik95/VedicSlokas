import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

export type LimitResult = { success: boolean; /** epoch ms when the caller may try again */ reset: number };

type Rule = { limit: number; windowSec: number };

/** Per-purpose limits. Tuned for a small site; adjust here only. */
export const RULES = {
  /** Link emails per IP per hour. */
  linkByIp: { limit: 10, windowSec: 60 * 60 },
  /** Link emails per address per hour. */
  linkByEmail: { limit: 5, windowSec: 60 * 60 },
  /** Minimum gap between two link emails to the same address. */
  linkCooldown: { limit: 1, windowSec: 60 },
  /** Confirm-button presses per IP (guards token guessing). */
  confirmByIp: { limit: 30, windowSec: 10 * 60 },
  /** Status polls from the "check your inbox" page per IP. */
  statusByIp: { limit: 240, windowSec: 10 * 60 },
  /** Dashboard writes (favourites, learned, prefs, interest) per user. */
  meWriteByUser: { limit: 120, windowSec: 60 },
  /** Sloka views recorded per user. */
  meViewByUser: { limit: 300, windowSec: 10 * 60 },
  /** Data exports per user. */
  meExportByUser: { limit: 5, windowSec: 60 * 60 },
  /** Account deletion and "sign out everywhere" attempts per user. */
  meAccountByUser: { limit: 10, windowSec: 60 * 60 },
  /** Payment reports per user (a real one is monthly; this only stops floods). */
  mePaymentByUser: { limit: 5, windowSec: 60 * 60 },
  /** Payment reviews per admin. */
  adminReviewByUser: { limit: 120, windowSec: 60 },
} as const satisfies Record<string, Rule>;

export type RuleName = keyof typeof RULES;

interface Limiter {
  limit(rule: RuleName, key: string): Promise<LimitResult>;
}

class UpstashLimiter implements Limiter {
  private readonly limiters: Record<RuleName, Ratelimit>;
  constructor(redis: Redis) {
    this.limiters = Object.fromEntries(
      (Object.keys(RULES) as RuleName[]).map((name) => [
        name,
        new Ratelimit({
          redis,
          prefix: `vedic:rl:${name}`,
          limiter: Ratelimit.slidingWindow(RULES[name].limit, `${RULES[name].windowSec} s`),
        }),
      ]),
    ) as Record<RuleName, Ratelimit>;
  }
  async limit(rule: RuleName, key: string): Promise<LimitResult> {
    const r = await this.limiters[rule].limit(key);
    return { success: r.success, reset: r.reset };
  }
}

/** Development fallback: a sliding-window log in process memory. Not shared across instances. */
class MemoryLimiter implements Limiter {
  private readonly hits = new Map<string, number[]>();
  async limit(rule: RuleName, key: string): Promise<LimitResult> {
    const { limit, windowSec } = RULES[rule];
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const id = `${rule}:${key}`;
    const recent = (this.hits.get(id) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      this.hits.set(id, recent);
      return { success: false, reset: recent[0] + windowMs };
    }
    recent.push(now);
    this.hits.set(id, recent);
    return { success: true, reset: now + windowMs };
  }
}

const store = globalThis as unknown as { __vedicLimiter?: Limiter };

function limiter(): Limiter {
  if (store.__vedicLimiter) return store.__vedicLimiter;
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = env();
  if (url && token) {
    store.__vedicLimiter = new UpstashLimiter(new Redis({ url, token }));
  } else {
    console.warn("[rate-limit] Upstash is not configured; using an in-memory limiter (development only).");
    store.__vedicLimiter = new MemoryLimiter();
  }
  return store.__vedicLimiter;
}

/** Keys are hashed so Redis never holds raw emails or IPs. */
const keyOf = (value: string) => createHash("sha256").update(value.toLowerCase()).digest("base64url").slice(0, 32);

export async function checkLimits(checks: Array<[RuleName, string]>): Promise<LimitResult> {
  let worst: LimitResult = { success: true, reset: 0 };
  for (const [rule, value] of checks) {
    const result = await limiter().limit(rule, keyOf(value));
    if (!result.success && (worst.success || result.reset > worst.reset)) worst = result;
  }
  return worst;
}

/** Test hook: start each test with a clean in-memory limiter. */
export function resetMemoryLimiterForTests(): void {
  store.__vedicLimiter = new MemoryLimiter();
}
