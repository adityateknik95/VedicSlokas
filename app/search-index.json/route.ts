import { normalize } from "@/lib/normalize";
import { slokas } from "@/lib/slokas";

/** Built once at build time: the small index the command palette searches in the browser. */
export const dynamic = "force-static";

export type SearchEntry = { slug: string; title: string; source: string; themes: string[]; line: string; citation: string; hay: string };

export function GET() {
  const entries: SearchEntry[] = slokas.map((s) => ({
    slug: s.slug,
    title: s.title,
    source: s.source,
    themes: s.themes,
    line: s.iast.split("\n")[0].replace(/\|/g, "").trim(),
    citation: s.reference.citation,
    hay: `${normalize([s.title, s.iast, s.translation, s.essence, s.reference.citation, s.deity, s.source, s.themes.join(" "), s.words.map((w) => `${w.word} ${w.meaning}`).join(" ")].join(" "))} ${s.devanagari}`,
  }));
  return Response.json(entries, { headers: { "Cache-Control": "public, max-age=3600" } });
}
