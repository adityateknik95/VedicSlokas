"use client";

import Link from "next/link";
import { useReturningVisitor } from "@/lib/account-nudge";
import { HERO } from "@/lib/landing-copy";
import { lineInLanguage, useReadingLanguage } from "@/lib/reading-language";
import { useSignedInHint } from "@/lib/session-hint";

/** The hero's real verse: today's, in the reader's script, one tap from the full page. */
export function TodaySloka({ slug, title, citation, line }: { slug: string; title: string; citation: string; line: string }) {
  const { text, lang, isDeva } = lineInLanguage(line, useReadingLanguage());
  const signedIn = useSignedInHint();
  const returning = useReturningVisitor();
  return (
    <div>
      <Link href={`/sloka/${slug}`} className="group mx-auto block max-w-2xl rounded-2xl px-4 py-2 transition-colors hover:bg-surface/40">
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent">{HERO.todayLabel}</span>
        <span lang={lang} className={`${isDeva ? "deva" : "indic"} mt-1.5 block text-lg leading-snug text-ink sm:text-xl`}>
          {text}
        </span>
        <span className="mt-1 block text-xs text-ink-muted group-hover:text-ink sm:text-sm">
          {citation.startsWith(title) ? citation : `${title} · ${citation}`}
        </span>
      </Link>
      {returning && signedIn === false && (
        <p className="mt-1 text-xs text-ink-muted">
          Welcome back.{" "}
          <Link href="/signup" className="font-semibold text-accent underline underline-offset-4">
            A free account starts your streak.
          </Link>
        </p>
      )}
    </div>
  );
}
