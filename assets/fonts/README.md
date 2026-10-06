# Fonts

All fonts are from Google Fonts and licensed under the SIL Open Font License.

- `web/inter-latin-var.woff2`: Inter (variable, 100–900), Latin subset only.
- `/public/fonts/tiro-devanagari-sanskrit.woff2`: Tiro Devanagari Sanskrit, Devanagari subset. Registered at runtime by the boot script in `app/layout.tsx` so it never blocks first paint.
- `CormorantGaramond-SemiBold.ttf`, `Inter-Regular.ttf`: used only by the Open Graph image generator (Satori needs TTF/OTF).

Cormorant Garamond for the site is loaded through `next/font/google`.

Why self-host these two: `next/font/google` declares every subset, so a single IAST
character in body text would pull in Inter's 84 KB latin-ext file, and spaces inside
Devanagari would pull in Tiro's Latin file. On phones those bytes delayed first paint.
