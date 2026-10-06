// Generates the mandala SVGs in public/motifs. Serving them as cached files
// (instead of ~250 inline DOM nodes each) keeps pages light on phones.
// Run: node scripts/build-motifs.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const r2 = (n) => Math.round(n * 100) / 100;
const petal = (inner, outer, w) => {
  const mid = (inner + outer) / 2;
  return `M0 ${-inner}Q${w} ${-mid} 0 ${-outer}Q${-w} ${-mid} 0 ${-inner}Z`;
};
const petalRing = (count, inner, outer, w, offset = 0, extra = "") =>
  `<g${extra}>` +
  Array.from({ length: count }, (_, i) => `<path d="${petal(inner, outer, w)}" transform="rotate(${r2((360 / count) * i + offset)})"/>`).join("") +
  "</g>";
const dotRing = (count, radius, r, extra = "") =>
  `<g fill="currentColor" stroke="none"${extra}>` +
  Array.from({ length: count }, (_, i) => {
    const a = ((Math.PI * 2) / count) * i;
    return `<circle cx="${r2(Math.sin(a) * radius)}" cy="${r2(-Math.cos(a) * radius)}" r="${r}"/>`;
  }).join("") +
  "</g>";
const spokes = (count, inner, outer, extra = "") =>
  `<g${extra}>` +
  Array.from({ length: count }, (_, i) => {
    const a = ((Math.PI * 2) / count) * i;
    return `<line x1="${r2(Math.sin(a) * inner)}" y1="${r2(-Math.cos(a) * inner)}" x2="${r2(Math.sin(a) * outer)}" y2="${r2(-Math.cos(a) * outer)}"/>`;
  }).join("") +
  "</g>";

function mandala({ full, color, strokeWidth }) {
  const body = [
    `<circle r="18"/>`,
    `<circle r="6" fill="currentColor" stroke="none" opacity=".8"/>`,
    petalRing(8, 18, 52, 14),
    `<circle r="58"/>`,
    petalRing(16, 58, 96, 11, 11.25),
    `<circle r="100"/>`,
    dotRing(32, 108, 1.6, ' opacity=".8"'),
    `<circle r="116"/>`,
    petalRing(24, 116, 160, 13),
    petalRing(24, 124, 150, 6, 7.5, ' opacity=".6"'),
    `<circle r="166"/>`,
    ...(full
      ? [
          spokes(48, 166, 186, ' opacity=".55"'),
          `<circle r="190"/>`,
          petalRing(36, 190, 228, 10, 5),
          dotRing(36, 236, 1.8, ' opacity=".7"'),
          `<circle r="244" opacity=".6" stroke-dasharray="2 6"/>`,
        ]
      : []),
  ].join("");
  const g = `<g fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round">${body}</g>`;
  // <symbol id="m"> lets pages draw it inline with <svg><use href="…#m"/></svg>
  // (themeable via currentColor, and never an LCP image candidate). The <use>
  // below makes the same file work as a plain <img> too.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -250 500 500" color="${color}"><symbol id="m" viewBox="-250 -250 500 500" overflow="visible">${g}</symbol><use href="#m"/></svg>\n`;
}

const out = new URL("../public/motifs/", import.meta.url);
mkdirSync(out, { recursive: true });
// Colour only matters for <img> use; inline <use> follows currentColor.
const colors = { gold: "#C9A24B" };
for (const [name, color] of Object.entries(colors)) {
  writeFileSync(new URL(`mandala-full-${name}.svg`, out), mandala({ full: true, color, strokeWidth: 0.8 }));
  writeFileSync(new URL(`mandala-simple-${name}.svg`, out), mandala({ full: false, color, strokeWidth: 0.9 }));
}
console.log("motifs written");
