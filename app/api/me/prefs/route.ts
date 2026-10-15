import { getPrefs, savePrefs } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { prefsBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

export const GET = meRoute(async ({ session }) => json({ prefs: await getPrefs(session.user.id) }));

/** Partial update: only the fields sent change. */
export const PATCH = meRoute(
  async ({ request, session }) => {
    const patch = await readBody(request, prefsBody);
    return json({ prefs: await savePrefs(session.user.id, patch) });
  },
  { limit: "meWriteByUser" },
);
