import "server-only";
import { NO_ENTITLEMENTS, type Entitlements } from "@/lib/dashboard/modules";
import { hasActiveSubscription } from "@/lib/subscriptions";

/**
 * What a student has paid for: the only place that decides access, so pages and navigation
 * never check plans themselves. Verses are free for everyone; the monthly plan unlocks the
 * learning modules. While a module's status is "soon" it still shows as coming soon.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  if (!(await hasActiveSubscription(userId))) return { ...NO_ENTITLEMENTS };
  return { liveClasses: true, notes: true, courses: true };
}
