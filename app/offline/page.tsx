import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui";
import { SavedOffline } from "@/components/layout/SavedOffline";

export const metadata: Metadata = { title: "You're offline", robots: { index: false, follow: false } };

/** Shown by the service worker when there is no connection and the page isn't saved. */
export default function OfflinePage() {
  return (
    <div className="temple-bg pb-16 pt-32 sm:pt-40">
      <Container className="max-w-2xl text-center">
        <Eyebrow>No connection</Eyebrow>
        <h1 className="display mt-4 text-5xl text-ink">You&apos;re offline</h1>
        <p className="mt-4 text-ink-muted">Your favourite slokas are saved on this device, so you can keep reading. Everything else comes back when you reconnect.</p>
        <SavedOffline />
      </Container>
    </div>
  );
}
