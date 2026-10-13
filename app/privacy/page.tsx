import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/auth/LegalPlaceholder";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

// TODO(legal): replace with a reviewed Privacy Policy (data collected, Google sign-in, email provider, retention, rights).
export default function PrivacyPage() {
  return (
    <LegalPlaceholder title="Privacy Policy">
      <p>
        To sign you in we store your name, email address, and, if you use Google, your Google account ID and profile picture. We keep a log of
        sign-in events for security. We never store passwords, because there aren&apos;t any.
      </p>
      <p>The final policy will describe how long this is kept, who processes it on our behalf, and how to ask for it to be deleted.</p>
    </LegalPlaceholder>
  );
}
