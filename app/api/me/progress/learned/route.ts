import { setLearned } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { learnedBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Marks a sloka learned or not learned. Idempotent. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { slug, learned } = await readBody(request, learnedBody);
    return json({ slug, learnedAt: await setLearned(session.user.id, slug, learned) });
  },
  { limit: "meWriteByUser" },
);
