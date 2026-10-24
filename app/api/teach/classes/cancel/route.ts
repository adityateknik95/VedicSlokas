import { audit } from "@/lib/audit";
import { cancelScheduledClass } from "@/lib/class-meetings";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { cancelClassBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Cancel a class that hasn't ended. Students then see it as cancelled and cannot join. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { id } = await readBody(request, cancelClassBody);
    const result = await cancelScheduledClass(session.user, id);
    if (!result.ok) return json({ error: result.reason }, result.reason === "forbidden" ? 403 : 404);
    await audit("class_cancelled", { userId: session.user.id, metadata: { classId: id } });
    return json({ ok: true });
  },
  { limit: "teachWriteByUser" },
);
