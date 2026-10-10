# VedicSlokas

A home for Sanskrit slokas: grand like the Vedic age, built for a young audience.
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Framer Motion · Lenis.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks)
npm start
```

Deploys to Vercel as-is: import the repo, no settings needed. Optionally set
`NEXT_PUBLIC_SITE_URL` (e.g. `https://vedicslokas.com`) so canonical URLs, the sitemap
and Open Graph links use your domain; otherwise Vercel's production URL is used.

## Content

All verses live in [`data/slokas.json`](data/slokas.json) (typed by [`lib/types.ts`](lib/types.ts)).
Every entry has `"verified": false`. Check each one against a trusted critical edition, then
flip it to `true`; the sloka page badge and footer count update automatically.

Things to look at when verifying:
- **Gāyatrī (Ṛgveda 3.62.10)**: the text omits the liturgical "oṃ bhūr bhuvaḥ svaḥ" prefix on purpose.
- **Stotras** have no chapters, so they're cited by work and verse number (`chapter: null`).
- **Śiva Tāṇḍava Stotram** has small spelling variants across printed editions.
- Translations and word glosses are original and should be reviewed too.

Audio: each entry points to `/audio/<slug>.mp3`. Drop files into `public/audio/`; until then the
Listen button says "Recitation coming soon".

## Structure

```
app/                 routes: home, library, sloka/[slug] (+ per-sloka OG image), about, sitemap, robots
components/motifs    inline-SVG motifs: mandala, lotus, pillar, palm-leaf edge, diya, Om, gold divider
components/motion    MotionProvider (Lenis + GSAP, reveal observer, reduced-motion)
components/home      hero, sloka of the day, pillars, 3D carousel, embers, count-up
components/library   search/filter browser, sloka card
components/sloka     audio, copy/share, Instagram-story card export
lib/                 data access + search normalisation, favorites store, fonts/idle helpers
scripts/             build-motifs.mjs: regenerates public/motifs/*.svg (`npm run motifs`)
```

## Performance notes (why things are the way they are)

- **Fonts.** Tiro Devanagari (117 KB) is registered by the inline boot script right after
  first paint (instantly on repeat visits), Inter is one self-hosted Latin file, and Cormorant is
  one weight. See [`assets/fonts/README.md`](assets/fonts/README.md).
- **Mandalas** are drawn with `<svg><use href="/motifs/…#m">`: cached once, themeable via
  `currentColor`, no DOM bloat, and never an LCP image.
- **Animation code is lazy.** Lenis + GSAP load on the first scroll/touch/key; embers start when
  the page is idle; the 3D carousel loads when it nears the viewport; Framer Motion's engine
  loads asynchronously. Below-the-fold sections use `content-visibility: auto`.
- **Reduced motion.** With `prefers-reduced-motion`, every animation becomes a simple fade and
  Lenis/GSAP/embers are never loaded.

Lighthouse (local production build, quiet machine): mobile Performance 91–95,
desktop 100; Accessibility, Best Practices and SEO 100 on every page.
