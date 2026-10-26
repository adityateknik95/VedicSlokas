import "server-only";
import { z } from "zod";

/**
 * Server environment, validated once on first use (and at server start via
 * instrumentation.ts). Validation is lazy, never at import time, so building the
 * static public pages never depends on auth secrets.
 *
 * Development is forgiving: without DATABASE_URL an in-process PGlite database
 * is used, without RESEND_API_KEY emails go to ./.dev-outbox, and without
 * Upstash an in-memory rate limiter is used. Production requires the real thing.
 */

// VEDIC_E2E=1 lets the end-to-end tests run a production build locally without real
// credentials. It is ignored on Vercel, so it can never relax a real deployment.
const isProd = process.env.NODE_ENV === "production" && !(process.env.VEDIC_E2E === "1" && !process.env.VERCEL);

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));
const flag = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /** Postgres (Neon) connection string. Unset in development = local PGlite. */
    DATABASE_URL: optional,
    /** Folder for the local PGlite database (development/tests only). */
    PGLITE_DIR: optional,
    /** At least 32 random characters. `openssl rand -base64 32`. */
    BETTER_AUTH_SECRET: optional,
    /** Public origin of the site, e.g. https://vedicslokas.vercel.app */
    BETTER_AUTH_URL: optional.pipe(z.url().optional()),
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    RESEND_API_KEY: optional,
    /** Verified sender, e.g. "VedicSlokas <hello@mail.vedicslokas.com>" */
    EMAIL_FROM: optional,
    UPSTASH_REDIS_REST_URL: optional.pipe(z.url().optional()),
    UPSTASH_REDIS_REST_TOKEN: optional,
    TURNSTILE_ENABLED: flag,
    TURNSTILE_SECRET_KEY: optional,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional,
    /** Sentry project DSN (public by design). Unset = no error reports are sent. */
    NEXT_PUBLIC_SENTRY_DSN: optional.pipe(z.url().optional()),
    /** Bump when the Terms or Privacy Policy change materially. */
    TERMS_VERSION: z.string().trim().min(1).default("2026-10-26"),
    /**
     * Who sees the paid plan and can pay: "on" (every signed-in student, the default),
     * "testers" (admins and SUBSCRIPTION_TESTERS only) or "off".
     */
    SUBSCRIPTIONS: z.enum(["off", "testers", "on"]).default("on"),
    /** Who may join live classes: "everyone" signed in (the free trial period) or "plan" (subscribers). */
    LIVE_CLASSES: z.enum(["everyone", "plan"]).default("everyone"),
    /** Comma separated emails that may test the paid plan while SUBSCRIPTIONS=testers. */
    SUBSCRIPTION_TESTERS: optional,
    /** Monthly price in whole rupees. */
    SUBSCRIPTION_PRICE_INR: z.coerce.number().int().min(1).max(100000).default(79),
    /** Where students pay. Read on the server only and shown on the payment page. */
    PAYMENT_UPI_ID: optional.pipe(z.string().regex(/^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,63}$/, "must look like name@bank").optional()),
    PAYMENT_UPI_NAME: optional,
    PAYMENT_BANK_HOLDER: optional,
    PAYMENT_BANK_NAME: optional,
    PAYMENT_BANK_ACCOUNT: optional.pipe(z.string().regex(/^\d{6,20}$/, "digits only").optional()),
    PAYMENT_BANK_IFSC: optional.pipe(z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "must be an IFSC like SBIN0001234").optional()),
  })
  .superRefine((env, ctx) => {
    const need = (key: keyof typeof env, why: string) => {
      if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: `${key} is required ${why}` });
    };
    if (isProd) {
      need("DATABASE_URL", "in production");
      need("BETTER_AUTH_SECRET", "in production");
      need("BETTER_AUTH_URL", "in production");
      need("GOOGLE_CLIENT_ID", "in production");
      need("GOOGLE_CLIENT_SECRET", "in production");
      need("RESEND_API_KEY", "in production");
      need("EMAIL_FROM", "in production");
      need("UPSTASH_REDIS_REST_URL", "in production");
      need("UPSTASH_REDIS_REST_TOKEN", "in production");
    }
    if (env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length < 32) {
      ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "BETTER_AUTH_SECRET must be at least 32 characters" });
    }
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({ code: "custom", path: ["GOOGLE_CLIENT_SECRET"], message: "Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither" });
    }
    if (Boolean(env.UPSTASH_REDIS_REST_URL) !== Boolean(env.UPSTASH_REDIS_REST_TOKEN)) {
      ctx.addIssue({ code: "custom", path: ["UPSTASH_REDIS_REST_TOKEN"], message: "Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither" });
    }
    if (env.TURNSTILE_ENABLED) {
      need("TURNSTILE_SECRET_KEY", "when TURNSTILE_ENABLED is on");
      need("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "when TURNSTILE_ENABLED is on");
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

/** Local development secret. Never used in production (validation requires a real one). */
export const DEV_AUTH_SECRET = "dev-only-secret-not-for-production-use-0000";

export function authSecret(): string {
  return env().BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET;
}

export function siteOrigin(): string {
  return env().BETTER_AUTH_URL ?? "http://localhost:3000";
}

export const isGoogleEnabled = () => Boolean(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET);
export const isTurnstileEnabled = () => env().TURNSTILE_ENABLED;
