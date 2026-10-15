import { mergeLocalFavourites } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { mergeBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Folds a device's saved favourites into the account (union, no duplicates). Safe to repeat. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { slugs } = await readBody(request, mergeBody);
    return json({ favourites: await mergeLocalFavourites(session.user.id, slugs) });
  },
  { limit: "meWriteByUser" },
);
