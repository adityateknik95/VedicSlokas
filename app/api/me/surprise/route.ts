import { z } from "zod";
import { getPrefs, listProgress } from "@/lib/dashboard/data";
import { json, meRoute, readBody } from "@/lib/dashboard/api";
import { pickSurprise } from "@/lib/dashboard/surprise";
import { getSloka, slokas } from "@/lib/slokas";
import type { SurpriseSloka } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

const body = z.object({ recent: z.array(z.string().max(120)).max(10) }).strict();

/** Picks a sloka for this student: unseen first, never the last five, gently towards their interests. */
export const POST = meRoute(
  async ({ request, session }) => {
    const { recent } = await readBody(request, body);
    const [prefs, progress] = await Promise.all([getPrefs(session.user.id), listProgress(session.user.id)]);
    const viewed = new Set(progress.map((p) => p.slug));
    const slug = pickSurprise({ candidates: slokas, viewed, recent, interests: prefs.interests });
    const s = slug ? getSloka(slug) : undefined;
    if (!s) return json({ sloka: null });
    const sloka: SurpriseSloka = {
      slug: s.slug,
      title: s.title,
      devanagari: s.devanagari,
      iast: s.iast,
      translation: s.translation,
      citation: s.reference.citation,
      source: s.source,
      unseen: !viewed.has(s.slug),
    };
    return json({ sloka });
  },
  { limit: "meViewByUser" },
);
