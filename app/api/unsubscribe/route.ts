import { NextResponse, type NextRequest } from "next/server";
import { siteOrigin } from "@/lib/env";
import { stopDailyEmail } from "@/lib/reminders";
import { readUnsubscribeToken } from "@/lib/unsubscribe-token";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe (RFC 8058): mail apps POST here directly, and the /unsubscribe page's
 * button does too. The signed token is the only thing it accepts, and it can only stop emails.
 */
export async function POST(request: NextRequest) {
  const userId = readUnsubscribeToken(request.nextUrl.searchParams.get("u"));
  if (userId) await stopDailyEmail(userId);
  const fromMailApp = (request.headers.get("content-type") ?? "").includes("form") && (await request.clone().text()).includes("List-Unsubscribe=One-Click");
  if (fromMailApp) return new NextResponse(null, { status: userId ? 200 : 400 });
  return NextResponse.redirect(new URL(`/unsubscribe?${userId ? "done=1" : "invalid=1"}`, siteOrigin()), 303);
}
