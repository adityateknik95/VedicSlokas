import { joinClass } from "@/lib/classes";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { joinBody } from "@/lib/dashboard/schemas";
import { getEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

/**
 * The meeting link for a class, only from ten minutes before it starts until it ends, and only
 * for students allowed to join. The link is never part of any page.
 */
export const POST = meRoute(
  async ({ request, session }) => {
    const { classId } = await readBody(request, joinBody);
    const { liveClasses } = await getEntitlements(session.user.id);
    const result = await joinClass(session.user.id, classId, liveClasses);
    if (!result.ok) return json({ error: result.reason }, result.reason === "not_found" ? 404 : result.reason === "not_entitled" ? 403 : 409);
    return json({ url: result.url });
  },
  { limit: "meJoinByUser" },
);
