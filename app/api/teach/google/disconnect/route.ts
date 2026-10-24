import { audit } from "@/lib/audit";
import { removeGoogleLink } from "@/lib/class-meetings";
import { json, meRoute } from "@/lib/dashboard/api";

export const dynamic = "force-dynamic";

/** Forgets the teacher's Google connection and asks Google to revoke it. Existing classes keep their links. */
export const POST = meRoute(
  async ({ session }) => {
    await removeGoogleLink(session.user.id);
    await audit("google_disconnected", { userId: session.user.id });
    return json({ ok: true });
  },
  { limit: "teachWriteByUser" },
);
