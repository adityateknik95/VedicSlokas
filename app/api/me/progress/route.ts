import { getPrefs, slokaState } from "@/lib/dashboard/data";
import { json, meRoute, readQuery } from "@/lib/dashboard/api";
import { getNote, listCollections } from "@/lib/dashboard/library-data";
import { slugQuery } from "@/lib/dashboard/schemas";
import { isPersonalised, readingFor } from "@/lib/reading";
import { getSloka } from "@/lib/slokas";

export const dynamic = "force-dynamic";

/**
 * Everything personal about one sloka, in one request, for the public sloka page after
 * hydration: learned, the student's collections (and which hold this sloka), their private
 * note, and the verse in their chosen script and language (when they chose one).
 */
export const GET = meRoute(async ({ request, session }) => {
  const { slug } = readQuery(request, slugQuery);
  const id = session.user.id;
  const [state, collections, note, prefs] = await Promise.all([slokaState(id, slug), listCollections(id), getNote(id, slug), getPrefs(id)]);
  const sloka = getSloka(slug);
  return json({
    ...state,
    collections: collections.map((c) => ({ id: c.id, name: c.name, has: c.slugs.includes(slug) })),
    note,
    reading: sloka && isPersonalised(prefs.script, prefs.meaningLang) ? readingFor(sloka, prefs.script, prefs.meaningLang) : null,
  });
});
