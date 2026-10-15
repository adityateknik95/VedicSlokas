import { slokaState } from "@/lib/dashboard/data";
import { json, meRoute, readQuery } from "@/lib/dashboard/api";
import { slugQuery } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** State of one sloka for this student (used by the public sloka page after hydration). */
export const GET = meRoute(async ({ request, session }) => {
  const { slug } = readQuery(request, slugQuery);
  return json(await slokaState(session.user.id, slug));
});
