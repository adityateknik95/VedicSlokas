import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { remindersBlocked, sendDueReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "no-store, max-age=0" };

/** Called every hour by the scheduler (.github/workflows/reminders.yml) with the shared secret. */
export async function POST(request: Request) {
  const secret = env().CRON_SECRET;
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok = Boolean(secret) && given.length === secret!.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  const blocked = remindersBlocked();
  if (blocked) return NextResponse.json({ error: "disabled", reason: blocked }, { status: 409, headers: noStore });
  return NextResponse.json(await sendDueReminders(), { headers: noStore });
}
