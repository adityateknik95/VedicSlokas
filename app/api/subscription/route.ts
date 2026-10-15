import { z } from "zod";
import { getPlanState, startTrial, submitPayment } from "@/lib/subscriptions";
import { json, meRoute, readBody } from "@/lib/dashboard/api";

export const dynamic = "force-dynamic";
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start_trial") }),
  z.object({ action: z.literal("submit_payment"), mode: z.enum(["upi", "bank"]), utr: z.string().trim().min(6).max(120) }),
]);

export const GET = meRoute(async ({ session }) => json({ plan: await getPlanState(session.user.id) }));
export const POST = meRoute(async ({ request, session }) => {
  const body = await readBody(request, bodySchema);
  if (body.action === "start_trial") {
    try { await startTrial(session.user.id); }
    catch (error) {
      if (error instanceof Error && error.message === "PLAN_ALREADY_SELECTED") return json({ error: "A plan has already been selected for this account." }, 409);
      throw error;
    }
    return json({ plan: await getPlanState(session.user.id) });
  }
  try {
    const paymentId = await submitPayment(session.user.id, body.mode, body.utr);
    return json({ paymentId, plan: await getPlanState(session.user.id), message: "Payment proof submitted. Subscription stays pending until an administrator verifies the transaction." }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_SUBSCRIBED") return json({ error: "Your subscription is already active." }, 409);
    throw error;
  }
}, { limit: "meWriteByUser" });
