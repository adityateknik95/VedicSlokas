import { getPrefs, recordView } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { viewBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Records a sloka view (at most once per sloka per day, in the student's timezone). Accepts sendBeacon. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { slug, tz } = await readBody(request, viewBody);
    const prefs = await getPrefs(session.user.id);
    const recorded = await recordView(session.user.id, slug, prefs.timezone ?? tz ?? "UTC");
    return json({ recorded });
  },
  { limit: "meViewByUser" },
);
