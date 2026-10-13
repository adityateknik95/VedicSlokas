import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/auth/LegalPlaceholder";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

// TODO(legal): replace with reviewed Terms of Service, then bump TERMS_VERSION so new consent is recorded.
export default function TermsPage() {
  return (
    <LegalPlaceholder title="Terms of Service">
      <p>These terms will explain how VedicSlokas accounts, live classes, recordings and notes may be used, and what we expect of students and teachers.</p>
      <p>Until the final version is published, please contact us with any questions about using VedicSlokas.</p>
    </LegalPlaceholder>
  );
}
