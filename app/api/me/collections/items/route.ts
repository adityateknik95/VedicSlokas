import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { setInCollection } from "@/lib/dashboard/library-data";
import { collectionItemBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Put a sloka in one of your collections, or take it out. Idempotent: the body says the state you want. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { collectionId, slug, on } = await readBody(request, collectionItemBody);
    const result = await setInCollection(session.user.id, collectionId, slug, on);
    if (!result.ok) return json({ error: result.reason }, result.reason === "not_found" ? 404 : 409);
    return json({ collectionId, slug, on });
  },
  { limit: "meWriteByUser" },
);
