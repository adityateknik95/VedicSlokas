import { audit } from "@/lib/audit";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { paymentBody } from "@/lib/dashboard/schemas";
import { requestMeta } from "@/lib/request-meta";
import { canUseSubscriptions, getPlan, submitPayment } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/** The student's plan: active until when, and any payment waiting to be checked. */
export const GET = meRoute(async ({ session }) => {
  if (!canUseSubscriptions(session.user)) return json({ error: "forbidden" }, 403);
  return json({ plan: await getPlan(session.user.id) });
});

/** Reports a manual payment. It stays pending until an admin finds it in the bank statement. */
export const POST = meRoute(
  async ({ request, session }) => {
    if (!canUseSubscriptions(session.user)) return json({ error: "forbidden" }, 403);
    const { mode, reference } = await readBody(request, paymentBody);
    const result = await submitPayment(session.user.id, mode, reference);
    if (!result.ok) return json({ error: result.reason }, result.reason === "invalid_reference" ? 400 : 409);
    const meta = await requestMeta();
    await audit("payment_submitted", { userId: session.user.id, ip: meta.ip, metadata: { paymentId: result.id, mode } });
    return json({ plan: await getPlan(session.user.id) }, 201);
  },
  { limit: "mePaymentByUser" },
);
