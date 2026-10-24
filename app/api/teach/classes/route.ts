import { audit } from "@/lib/audit";
import { saveClass } from "@/lib/classes";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { classBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Create (no id) or edit a live class. Teachers: their own classes. Admins: any, and may assign the teacher. */
export const POST = meRoute(
  async ({ request, session }) => {
    const input = await readBody(request, classBody);
    const result = await saveClass(session.user, input);
    if (!result.ok) return json({ error: result.reason }, result.reason === "forbidden" ? 403 : result.reason === "not_found" ? 404 : 400);
    await audit("class_saved", { userId: session.user.id, metadata: { classId: result.id, created: !input.id } });
    return json({ id: result.id });
  },
  { limit: "teachWriteByUser" },
);
