import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { createCollection, deleteCollection, listCollections, renameCollection } from "@/lib/dashboard/library-data";
import { collectionBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

export const GET = meRoute(async ({ session }) => json({ collections: await listCollections(session.user.id) }));

/** Create, rename or delete one of your collections. */
export const POST = meRoute(
  async ({ request, session }) => {
    const body = await readBody(request, collectionBody);
    const id = session.user.id;
    const result =
      body.action === "create" ? await createCollection(id, body.name) : body.action === "rename" ? await renameCollection(id, body.id, body.name) : await deleteCollection(id, body.id);
    if (!result.ok) return json({ error: result.reason }, result.reason === "not_found" ? 404 : 409);
    return json({ id: result.id, collections: await listCollections(id) });
  },
  { limit: "meWriteByUser" },
);
