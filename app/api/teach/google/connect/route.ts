import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isTeacher } from "@/lib/classes";
import { siteOrigin } from "@/lib/env";
import { consentUrl, GoogleError } from "@/lib/google-calendar";
import { getSession } from "@/lib/session";
import { GOOGLE_STATE_COOKIE } from "../state";

export const dynamic = "force-dynamic";

/** Sends a teacher to Google to allow Calendar access. A one-time state cookie ties the reply to this browser. */
export async function GET() {
  const session = await getSession();
  const back = new URL("/dashboard/classes/manage", siteOrigin());
  if (!session || !isTeacher(session.user)) return NextResponse.redirect(new URL("/login?callbackUrl=%2Fdashboard%2Fclasses%2Fmanage", siteOrigin()));
  const state = randomBytes(32).toString("base64url");
  let url: string;
  try {
    url = consentUrl(state, session.user.email);
  } catch (error) {
    if (!(error instanceof GoogleError)) throw error;
    back.searchParams.set("google", "not_configured");
    return NextResponse.redirect(back);
  }
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_STATE_COOKIE, `${state}.${session.user.id}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: siteOrigin().startsWith("https://"),
    path: "/api/teach/google",
    maxAge: 10 * 60,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
