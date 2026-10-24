import "server-only";
import { NO_ENTITLEMENTS, type Entitlements } from "@/lib/dashboard/modules";
import { env } from "@/lib/env";
import { hasActiveSubscription } from "@/lib/subscriptions";

/**
 * What a student may use: the only place that decides access, so pages and navigation never
 * check plans themselves. Verses are free for everyone; the monthly plan unlocks the learning
 * modules. Live classes are open to every signed-in student while LIVE_CLASSES=everyone.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const subscribed = await hasActiveSubscription(userId);
  const classesForAll = env().LIVE_CLASSES === "everyone";
  if (!subscribed) return { ...NO_ENTITLEMENTS, liveClasses: classesForAll };
  return { liveClasses: true, notes: true, courses: true };
}
