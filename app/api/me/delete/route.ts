import { cookies, headers } from "next/headers";
import { audit } from "@/lib/audit";
import { getAuth, SESSION_HINT_COOKIE } from "@/lib/auth";
import { deleteAccount } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { deleteBody } from "@/lib/dashboard/schemas";
import { accountDeletedEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { siteOrigin } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Deletes the account immediately: every row of the student's data goes (database cascade),
 * every session on every device ends, and a confirmation email is sent.
 */
export const POST = meRoute(
  async ({ request, session }) => {
    await readBody(request, deleteBody);
    const { id, email, name } = session.user;

    const auth = await getAuth();
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // The session row goes with the user below anyway.
    }
    const removed = await deleteAccount(id, email);
    (await cookies()).delete(SESSION_HINT_COOKIE);

    // The user no longer exists, so the log entry carries counts only: nothing personal.
    await audit("account_deleted", { metadata: removed });
    try {
      await sendEmail(email, accountDeletedEmail({ name, siteUrl: siteOrigin() }));
    } catch (error) {
      await audit("email_send_failed", { metadata: { kind: "account_deleted", reason: error instanceof Error ? error.name : "unknown" } });
    }
    return json({ deleted: true });
  },
  { limit: "meAccountByUser" },
);
