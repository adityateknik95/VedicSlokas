import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { userRole, type UserRole } from "@/db/schema";
import { getAuth } from "./auth";
import { safeCallbackUrl } from "./redirects";

/** The signed-in user's session, validated against the database. Deduplicated per request. */
export const getSession = cache(async () => {
  // Read the request first: this marks the route as per-request before any auth setup runs.
  const requestHeaders = await headers();
  const auth = await getAuth();
  return auth.api.getSession({ headers: requestHeaders });
});

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type SessionUser = Session["user"];

/** Use in server components/actions that need a user. `returnTo` is where to come back after login. */
export async function requireUser(returnTo: string): Promise<Session> {
  const session = await getSession();
  // `expired=1` tells proxy.ts not to bounce us back here because of a stale session cookie.
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl(returnTo))}&expired=1`);
  return session;
}

export function roleOf(user: Pick<SessionUser, "role">): UserRole {
  return (userRole.enumValues as readonly string[]).includes(user.role ?? "") ? (user.role as UserRole) : "student";
}

export function hasRole(user: Pick<SessionUser, "role">, allowed: readonly UserRole[]): boolean {
  return allowed.includes(roleOf(user));
}

/**
 * Typed role gate for future teacher/admin areas.
 * TODO(admin): use in app/admin once the admin panel exists.
 */
export async function requireRole(allowed: readonly UserRole[], returnTo: string): Promise<Session> {
  const session = await requireUser(returnTo);
  if (!hasRole(session.user, allowed)) redirect("/dashboard?denied=1");
  return session;
}
