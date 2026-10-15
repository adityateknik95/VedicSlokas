import { addFavourite, listFavourites, removeFavourite } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { favouriteBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** This student's favourites, newest first. */
export const GET = meRoute(async ({ session }) => json({ favourites: await listFavourites(session.user.id) }));

/** Save or unsave one sloka. Idempotent: the body says the state you want, not "toggle". */
export const POST = meRoute(
  async ({ request, session }) => {
    const { slug, saved } = await readBody(request, favouriteBody);
    if (saved) await addFavourite(session.user.id, slug);
    else await removeFavourite(session.user.id, slug);
    return json({ slug, saved });
  },
  { limit: "meWriteByUser" },
);
