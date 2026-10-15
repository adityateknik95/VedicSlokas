import { listInterest, setInterest } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { interestBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

export const GET = meRoute(async ({ session }) => json({ features: await listInterest(session.user.id) }));

/** "Notify me" for a coming-soon module. Idempotent: the body says the state you want. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { feature, on } = await readBody(request, interestBody);
    await setInterest(session.user.id, feature, on);
    return json({ feature, on });
  },
  { limit: "meWriteByUser" },
);
