import { ImageResponse } from "next/og";
import { OgMandala, ogFonts, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "VedicSlokas: Sanskrit slokas for a new generation";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(700px 500px at 50% 45%, #2a1a3a 0%, #0E0B1F 70%)",
          color: "#F3E7CF",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", display: "flex" }}>
          <OgMandala size={900} opacity={0.25} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: "Inter", fontSize: 22, letterSpacing: 8, textTransform: "uppercase", color: "#F0A04B" }}>
            Sanskrit for a new generation
          </div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 128, marginTop: 20 }}>
            Vedic<span style={{ color: "#D9B45C" }}>Slokas</span>
          </div>
          <div style={{ fontFamily: "Cormorant", fontSize: 40, color: "#CBBD9F", marginTop: 10 }}>{site.tagline}</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
