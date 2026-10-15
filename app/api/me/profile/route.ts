import { updateDisplayName } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { profileBody } from "@/lib/dashboard/schemas";

export const dynamic = "force-dynamic";

/** Display name only. Email is the sign-in identity and is not editable here. */
export const PATCH = meRoute(
  async ({ request, session }) => {
    const { name } = await readBody(request, profileBody);
    await updateDisplayName(session.user.id, name);
    return json({ name });
  },
  { limit: "meWriteByUser" },
);
