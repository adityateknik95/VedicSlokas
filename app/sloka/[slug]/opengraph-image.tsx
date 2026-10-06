import { ImageResponse } from "next/og";
import { getSloka, slokas } from "@/lib/slokas";
import { OgMandala, ogFonts, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "A Sanskrit sloka from VedicSlokas";

export function generateStaticParams() {
  return slokas.map((s) => ({ slug: s.slug }));
}

// Satori cannot shape Devanagari conjuncts, so OG cards use the title, IAST and
// translation; the Devanagari lives on the page and on the downloadable story card.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSloka(slug)!;
  const iastLine = s.iast.split("\n")[0].replace(/\s*\|+\s*$/, "");
  const translation = s.translation.length > 150 ? s.translation.slice(0, 147).replace(/\s+\S*$/, "") + "…" : s.translation;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(800px 500px at 80% 40%, #2a1a3a 0%, #0E0B1F 65%)",
          color: "#F3E7CF",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: -170, top: -65, display: "flex" }}>
          <OgMandala />
        </div>
        <div style={{ position: "absolute", inset: 24, border: "1.5px solid rgba(201,162,75,0.45)", borderRadius: 24, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 80px", width: 900 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#F0A04B" }}>{s.reference.citation}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Cormorant", fontSize: 84, lineHeight: 1.02, color: "#F3E7CF" }}>{s.title}</div>
            <div style={{ fontFamily: "Cormorant", fontSize: 34, color: "#D9B45C", marginTop: 18 }}>{iastLine}</div>
            <div style={{ fontSize: 26, lineHeight: 1.45, color: "#CBBD9F", marginTop: 26 }}>{`“${translation}”`}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Cormorant", fontSize: 40 }}>
            Vedic<span style={{ color: "#D9B45C" }}>Slokas</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
