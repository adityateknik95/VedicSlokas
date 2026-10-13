import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { getDb, schema, type Db } from "@/db";
import { audit } from "./audit";
import { signInLinkEmail } from "./email/templates";
import { sendEmail } from "./email/send";
import { authSecret, env, isGoogleEnabled, siteOrigin } from "./env";
import { DEFAULT_AFTER_LOGIN, safeCallbackUrl } from "./redirects";

export const MAGIC_LINK_MINUTES = 15;
export const SESSION_DAYS = 30;
/** Non-secret, readable hint so static pages can show "Dashboard" instead of "Log in" without a server call. */
export const SESSION_HINT_COOKIE = "vs_signed_in";

const isSecure = () => siteOrigin().startsWith("https://");

function buildAuth(db: Db) {
  const google = isGoogleEnabled();

  return betterAuth({
    appName: "VedicSlokas",
    baseURL: siteOrigin(),
    basePath: "/api/auth",
    secret: authSecret(),
    // CSRF: Better Auth rejects mutating requests whose Origin is not in this list.
    trustedOrigins: [siteOrigin()],
    database: drizzleAdapter(db, { provider: "pg", schema }),

    // Passwordless only. Extension point: add providers here (and nothing else).
    emailAndPassword: { enabled: false },
    socialProviders: google
      ? {
          google: {
            clientId: env().GOOGLE_CLIENT_ID ?? "",
            clientSecret: env().GOOGLE_CLIENT_SECRET ?? "",
            // Better Auth requests exactly "openid email profile" by default: identity only.
            prompt: "select_account",
          },
        }
      : {},

    account: {
      accountLinking: {
        enabled: true,
        // No provider is "trusted" blindly: Google is linked to an existing email account
        // only when Google reports the address as verified.
        trustedProviders: [],
        // A magic-link account that never clicked its link may still be linked, because the
        // verified Google email proves ownership; Better Auth then marks it verified.
        requireLocalEmailVerified: false,
        allowDifferentEmails: false,
      },
    },

    // TODO(device-limit): cap concurrent sessions per student (e.g. revoke the oldest in a
    // databaseHooks.session.create.before hook) once paid plans exist.
    session: {
      expiresIn: 60 * 60 * 24 * SESSION_DAYS,
      // Sliding expiry: refresh the 30-day window at most once a day of activity.
      updateAge: 60 * 60 * 24,
      // No cookie cache: every check hits the database so sign-out and revocation are immediate.
      cookieCache: { enabled: false },
    },

    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "student", input: false },
        termsAcceptedAt: { type: "date", required: false, input: false },
        termsVersion: { type: "string", required: false, input: false },
      },
    },

    advanced: {
      useSecureCookies: isSecure(),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: isSecure() },
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    },

    databaseHooks: {
      user: {
        create: {
          // Google sign-up shows a consent notice under the button; record it like the checkbox.
          before: async (user, ctx) => {
            if (ctx?.path?.startsWith("/callback/")) {
              return { data: { ...user, termsAcceptedAt: new Date(), termsVersion: env().TERMS_VERSION } };
            }
            return { data: user };
          },
        },
      },
      session: {
        create: {
          after: async (session, ctx) => {
            if (ctx?.path?.startsWith("/callback/google")) {
              await audit("google_sign_in", { userId: session.userId, ip: session.ipAddress, userAgent: session.userAgent });
            }
          },
        },
      },
    },

    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        const cookie = { path: "/", sameSite: "lax" as const, secure: isSecure(), httpOnly: false };
        if (ctx.context.newSession) {
          ctx.setCookie(SESSION_HINT_COOKIE, "1", { ...cookie, maxAge: 60 * 60 * 24 * SESSION_DAYS });
        } else if (ctx.path === "/sign-out") {
          ctx.setCookie(SESSION_HINT_COOKIE, "", { ...cookie, maxAge: 0 });
        }
      }),
    },

    // TODO(2fa): optional second factor for teachers/admins (Better Auth twoFactor plugin).
    // Out of scope by design: passwords and phone OTP. Add new sign-in methods here only.
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_MINUTES * 60,
        // Only a SHA-256 hash of the token is stored; lookups are by hash.
        storeToken: "hashed",
        // Accounts are created explicitly by the sign-up form (with consent), never by a stray link.
        disableSignUp: true,
        sendMagicLink: async ({ email, token, url }) => {
          // The emailed link opens a confirmation page; only its POST button uses the token,
          // so mail scanners that prefetch links cannot burn it.
          const next = safeCallbackUrl(new URL(url).searchParams.get("callbackURL"), DEFAULT_AFTER_LOGIN);
          const confirm = new URL("/auth/confirm", siteOrigin());
          confirm.searchParams.set("token", token);
          if (next !== DEFAULT_AFTER_LOGIN) confirm.searchParams.set("next", next);
          await sendEmail(email, signInLinkEmail({ url: confirm.toString(), email, minutes: MAGIC_LINK_MINUTES }));
        },
      }),
      // Must stay last: lets server actions set the session cookie.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof buildAuth>;

const store = globalThis as unknown as { __vedicAuth?: Promise<Auth> };

/** The Better Auth instance (created once per server instance). */
export function getAuth(): Promise<Auth> {
  store.__vedicAuth ??= getDb()
    .then(buildAuth)
    .catch((error: unknown) => {
      store.__vedicAuth = undefined;
      throw error;
    });
  return store.__vedicAuth;
}
