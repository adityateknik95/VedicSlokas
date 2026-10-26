import { json, meRoute, readBody, readQuery } from "@/lib/dashboard/api";
import { getNote, saveNote } from "@/lib/dashboard/library-data";
import { noteBody, slugQuery } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Your private note on a sloka. Nobody else can read it. */
export const GET = meRoute(async ({ request, session }) => {
  const { slug } = readQuery(request, slugQuery);
  return json({ note: await getNote(session.user.id, slug) });
});

/** Saves the note; an empty note deletes it. */
export const PUT = meRoute(
  async ({ request, session }) => {
    const { slug, body } = await readBody(request, noteBody);
    return json({ note: await saveNote(session.user.id, slug, body) });
  },
  { limit: "meWriteByUser" },
);
