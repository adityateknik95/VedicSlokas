import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap routing only: checks whether a session cookie is present, never whether it is valid.
 * Real validation happens in server code (lib/session.ts) on every protected page and action.
 */
const PROTECTED = ["/dashboard", "/admin"];
const GUEST_ONLY = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // A stale cookie sends people here with ?expired=1; let them log in instead of looping.
  if (hasSession && GUEST_ONLY.includes(pathname) && searchParams.get("expired") !== "1") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
