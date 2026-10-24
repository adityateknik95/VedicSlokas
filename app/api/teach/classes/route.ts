import { audit } from "@/lib/audit";
import { scheduleClass } from "@/lib/class-meetings";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { classBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/**
 * Create (no id) or edit a live class. Teachers: their own classes. Admins: any, and may assign
 * the teacher. Without a meeting link, a Google Meet link is made on the teacher's Google account.
 */
export const POST = meRoute(
  async ({ request, session }) => {
    const input = await readBody(request, classBody);
    const result = await scheduleClass(session.user, input);
    if (!result.ok) {
      const status = { forbidden: 403, not_found: 404, google_not_connected: 409, google_failed: 502 }[result.reason as string] ?? 400;
      return json({ error: result.reason }, status);
    }
    await audit("class_saved", { userId: session.user.id, metadata: { classId: result.id, created: !input.id } });
    return json({ id: result.id });
  },
  { limit: "teachWriteByUser" },
);
