import { z } from "zod";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { verifyPayment } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
const bodySchema = z.object({ verified: z.boolean() });
export const POST = meRoute(async ({ request, session }) => {
  if (session.user.role !== "admin") return json({ error: "forbidden" }, 403);
  const { verified } = await readBody(request, bodySchema);
  const paymentId = new URL(request.url).pathname.split("/").at(-2);
  if (!paymentId) return json({ error: "invalid" }, 400);
  try {
    await verifyPayment(paymentId, verified);
    return json({ ok: true, status: verified ? "active" : "rejected" });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_PENDING") return json({ error: "Payment was not found or is no longer pending." }, 409);
    throw error;
  }
}, { limit: "meWriteByUser" });
