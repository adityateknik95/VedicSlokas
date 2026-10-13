import { ImageResponse } from "next/og";
import { HERO, META } from "@/lib/landing-copy";
import { CosmosCard, ogFonts, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = META.title;

export default async function Image() {
  return new ImageResponse(<CosmosCard eyebrow={HERO.eyebrow} lead={HERO.titleLead} tail={HERO.titleTail} emphasis={HERO.titleEmphasis} />, {
    ...size,
    fonts: await ogFonts(),
  });
}
