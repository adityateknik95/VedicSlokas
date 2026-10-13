import type { FieldErrors } from "./auth-schemas";

/** Result shapes returned by the auth server actions to their forms. */

export type RequestLinkState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: FieldErrors; values: { name?: string; email?: string } }
  | { status: "rate_limited"; retryAt: number }
  | { status: "error"; message: string }
  | { status: "sent" };

export type ConfirmState =
  | { status: "idle" }
  | { status: "expired" }
  | { status: "invalid" }
  | { status: "rate_limited"; retryAt: number }
  | { status: "error"; message: string };

export const IDLE: { status: "idle" } = { status: "idle" };
