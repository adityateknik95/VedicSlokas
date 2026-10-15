import "server-only";
import { NO_ENTITLEMENTS, type Entitlements } from "@/lib/dashboard/modules";

/**
 * What a student has paid for. Today nothing is sold, so everything is false and every
 * paid module shows as "coming soon" (or locked, once its status flips to "live").
 *
 * TODO(subscriptions): read the student's active plan (e.g. a `subscription` table kept in
 * sync by the payment provider's webhook) and map it to these flags. Keep this the only
 * place that decides access, so pages and navigation never check plans themselves.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  void userId;
  return { ...NO_ENTITLEMENTS };
}
