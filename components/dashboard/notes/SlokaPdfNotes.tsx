"use client";

import { useState } from "react";

type PdfLanguage = "sa" | "en" | "kn" | "te" | "ta";
const LANGUAGES: { code: PdfLanguage; label: string; native: string; description: string }[] = [
  { code: "sa", label: "Sanskrit", native: "संस्कृतम्", description: "Sanskrit verses in Roman transliteration" },
  { code: "en", label: "English", native: "English", description: "English transliteration and meanings" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", description: "Kannada verses and meanings" },
  { code: "te", label: "Telugu", native: "తెలుగు", description: "Telugu verses and meanings" },
  { code: "ta", label: "Tamil", native: "தமிழ்", description: "Tamil verses and meanings" },
];
const PDF_BASE = "/notes/bhagavad-gita/chapter-1-slokas-1-12-";

export function SlokaPdfNotes({ defaultLanguage }: { defaultLanguage: string }) {
  const supported = LANGUAGES.some((language) => language.code === defaultLanguage);
  const [language, setLanguage] = useState<PdfLanguage>(supported ? (defaultLanguage as PdfLanguage) : "en");
  const current = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[1];
  const pdfUrl = `${PDF_BASE}${language}.pdf`;

  return (
    <div className="space-y-6">
      <section className="dash-card p-6 sm:p-8">
        <p className="eyebrow">Study material · Chapter 1</p>
        <h2 className="display mt-2 text-2xl text-ink sm:text-3xl">Arjuna Vishada Yoga</h2>
        <p className="mt-2 text-sm text-ink-muted">Srimad Bhagavad Gita · Slokas 1–12</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label htmlFor="notes-language" className="block text-sm font-medium text-ink">Choose your own language</label>
            <select id="notes-language" value={language} onChange={(event) => setLanguage(event.target.value as PdfLanguage)} className="mt-2 h-12 w-full rounded-xl border border-line bg-bg-2 px-4 text-ink focus:border-gold sm:min-w-64">
              {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label} · {item.native}</option>)}
            </select>
            <p className="mt-2 text-xs text-ink-muted" aria-live="polite">{current.description}</p>
          </div>
          <a href={pdfUrl} download={`VedicSlokas-Bhagavad-Gita-Chapter-1-${language}.pdf`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-[#21170a] transition hover:brightness-105">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Download {current.label} PDF
          </a>
        </div>
      </section>
      <section className="dash-card overflow-hidden" aria-label={`${current.label} PDF preview`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div><h3 className="font-semibold text-ink">Chapter 1 · Slokas 1–12</h3><p className="mt-1 text-xs text-ink-muted">PDF preview · {current.label}</p></div>
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent underline underline-offset-4">Open in new tab</a>
        </div>
        <iframe key={language} title={`${current.label} version of Bhagavad Gita Chapter 1 slokas 1–12`} src={`${pdfUrl}#view=FitH`} className="h-[70vh] min-h-[520px] w-full bg-white" />
        <p className="px-5 py-3 text-xs text-ink-muted">If the preview does not appear on your device, use the download button or open the PDF in a new tab.</p>
      </section>
    </div>
  );
}
