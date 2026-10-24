import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { saveGoogleLink } from "@/lib/class-meetings";
import { isTeacher } from "@/lib/classes";
import { siteOrigin } from "@/lib/env";
import { exchangeCode, GoogleError } from "@/lib/google-calendar";
import { getSession } from "@/lib/session";
import { GOOGLE_STATE_COOKIE } from "../state";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Google sends the teacher back here. Only the browser that started the consent, signed in as the same teacher, is accepted. */
export async function GET(request: NextRequest) {
  const back = new URL("/dashboard/classes/manage", siteOrigin());
  const done = (outcome: string) => {
    back.searchParams.set("google", outcome);
    const res = NextResponse.redirect(back);
    res.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/teach/google" });
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  const session = await getSession();
  const params = request.nextUrl.searchParams;
  const [state, userId] = (request.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "").split(".");
  if (!session || !isTeacher(session.user) || !state || userId !== session.user.id || !same(state, params.get("state") ?? "")) return done("error");
  if (params.get("error")) return done("denied");
  const code = params.get("code");
  if (!code) return done("error");

  try {
    const { refreshToken, email } = await exchangeCode(code);
    await saveGoogleLink(session.user.id, email, refreshToken);
    await audit("google_connected", { userId: session.user.id, metadata: { googleEmail: email } });
    return done("connected");
  } catch (error) {
    if (!(error instanceof GoogleError)) throw error;
    console.error("[google] connect failed:", error.message);
    return done(error.code === "no_scope" ? "no_calendar" : "error");
  }
}
