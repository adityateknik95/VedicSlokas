import { cookies } from "next/headers";
import { audit } from "@/lib/audit";
import { SESSION_HINT_COOKIE } from "@/lib/auth";
import { revokeAllSessions } from "@/lib/dashboard/data";
import { json, meRoute } from "@/lib/dashboard/api";
import { requestMeta } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

/** Ends every session of this student, on every device, including this one. */
export const POST = meRoute(
  async ({ session }) => {
    const ended = await revokeAllSessions(session.user.id);
    const store = await cookies();
    store.delete(SESSION_HINT_COOKIE);
    for (const c of store.getAll()) if (c.name.endsWith("better-auth.session_token")) store.delete(c.name);
    const meta = await requestMeta();
    await audit("sign_out", { userId: session.user.id, ip: meta.ip, userAgent: meta.userAgent, metadata: { allDevices: true, sessions: ended } });
    return json({ signedOut: ended });
  },
  { limit: "meAccountByUser" },
);
