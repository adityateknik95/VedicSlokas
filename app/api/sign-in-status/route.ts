import { NextResponse } from "next/server";
import { checkLimits } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { getSession } from "@/lib/session";
import { currentAttempt } from "@/lib/sign-in-attempts";

export type SignInStatus = { signedIn: boolean; attempt: "none" | "pending" | "completed" | "expired" };

/** Polled lightly by the "check your inbox" page. Reveals nothing beyond the caller's own attempt. */
export async function GET(): Promise<NextResponse<SignInStatus | { error: string }>> {
  const headers = { "Cache-Control": "no-store" };
  const limit = await checkLimits([["statusByIp", (await requestMeta()).ip]]);
  if (!limit.success) return NextResponse.json({ error: "slow_down" }, { status: 429, headers });

  const [session, attempt] = await Promise.all([getSession(), currentAttempt()]);
  const state: SignInStatus["attempt"] = !attempt ? "none" : attempt.completed ? "completed" : attempt.expired ? "expired" : "pending";
  return NextResponse.json({ signedIn: Boolean(session), attempt: state }, { headers });
}
