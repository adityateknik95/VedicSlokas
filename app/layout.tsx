import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClientExtras } from "@/components/layout/ClientExtras";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { slokas } from "@/lib/slokas";
import { site } from "@/lib/site";

// Font budget matters on phones (most visitors). See assets/fonts/README.md.
// Tiro Devanagari is registered by the boot script below rather than here, so its
// 117 KB never delays first paint. Cormorant: one weight, roman only (IAST uses the
// browser's synthesized slant). Inter: one variable Latin file.
const cormorant = Cormorant_Garamond({
  weight: "500",
  subsets: ["latin", "latin-ext"],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = localFont({
  src: "../assets/fonts/web/inter-latin-var.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: Sanskrit slokas for a new generation`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["Sanskrit", "sloka", "shloka", "Bhagavad Gita", "Upanishads", "Vedas", "stotra", "mantra", "Devanagari"],
  openGraph: { type: "website", siteName: site.name, locale: "en_IN", url: "/" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0E0B1F",
  width: "device-width",
  initialScale: 1,
};

// Runs before paint:
// 1. applies the saved theme (no flash);
// 2. marks JS as available so scroll reveals can start hidden (if the reveal
//    observer hasn't booted within 3s, everything is shown anyway);
// 3. registers Tiro Devanagari. On a first visit the @font-face is added right
//    after the browser reports first-contentful-paint, so the font never delays
//    it and verses swap in from the system Devanagari face. Once it has loaded, later visits register it
//    immediately and the cached file is used from the first frame.
const TIRO_CSS =
  "@font-face{font-family:'Tiro Devanagari Sanskrit';src:url(/fonts/tiro-devanagari-sanskrit.woff2) format('woff2');font-weight:400;font-style:normal;font-display:swap;unicode-range:U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}";
const bootScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('vedicslokas:theme');if(t==='parchment'||t==='night'){d.dataset.theme=t;if(t==='parchment'){var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute('content','#F3E7CF')}}}catch(e){}d.classList.add('js');setTimeout(function(){if(!d.classList.contains('reveal-ready'))d.classList.add('no-motion')},3000);function tiro(){var s=document.createElement('style');s.textContent=${JSON.stringify(TIRO_CSS)};document.head.appendChild(s);if(document.fonts){document.fonts.load("1em 'Tiro Devanagari Sanskrit'","क").then(function(){try{localStorage.setItem('vedicslokas:tiro','1')}catch(e){}})}}var cached=false;try{cached=localStorage.getItem('vedicslokas:tiro')==='1'}catch(e){}if(cached){tiro()}else{var done=false;var go=function(){if(!done){done=true;setTimeout(tiro,0)}};try{new PerformanceObserver(function(l,o){if(l.getEntriesByName('first-contentful-paint').length){o.disconnect();go()}}).observe({type:'paint',buffered:true})}catch(e){}setTimeout(go,2500)}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="night"
      suppressHydrationWarning
      className={`${cormorant.variable} ${inter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-dvh">
        <MotionProvider>
          <Header slugs={slokas.map((s) => s.slug)} />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <ClientExtras />
        </MotionProvider>
      </body>
    </html>
  );
}
