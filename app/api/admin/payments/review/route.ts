import { audit } from "@/lib/audit";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { reviewBody } from "@/lib/dashboard/schemas";
import { hasRole } from "@/lib/session";
import { reviewPayment } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/** Approve or reject a reported payment, after finding it in the bank or UPI statement. Admins only. */
export const POST = meRoute(
  async ({ request, session }) => {
    if (!hasRole(session.user, ["admin"])) return json({ error: "forbidden" }, 403);
    const { paymentId, approve } = await readBody(request, reviewBody);
    const result = await reviewPayment(paymentId, approve, session.user.id);
    if (!result.ok) return json({ error: "not_pending", message: "That payment was already reviewed, or doesn't exist." }, 409);
    await audit(approve ? "payment_verified" : "payment_rejected", {
      userId: session.user.id,
      metadata: { paymentId, student: result.userId, expiresAt: result.expiresAt },
    });
    return json({ ok: true, expiresAt: result.expiresAt });
  },
  { limit: "adminReviewByUser" },
);
