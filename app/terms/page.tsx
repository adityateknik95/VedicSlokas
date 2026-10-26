import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The simple rules for using VedicSlokas: accounts, live classes, the monthly plan and the verses.",
  alternates: { canonical: "/terms" },
};

// TODO(legal): have this reviewed by a qualified professional, and fill in the price and refund policy, before paid plans
// open to everyone. Then bump TERMS_VERSION so new sign-ups record the new version.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="26 October 2026"
      intro={
        <p>
          VedicSlokas shares Sanskrit verses and helps you learn them. By creating an account you agree to these terms and to our{" "}
          <Link href="/privacy">Privacy Policy</Link>. Reading the verses needs no account.
        </p>
      }
    >
      <LegalSection id="account" title="Your account">
        <ul>
          <li>Sign in with an email link or with Google. Keep access to that email or Google account; it is how you get into VedicSlokas.</li>
          <li>One account per person. Don&apos;t share your account or sign-in links.</li>
          <li>If you are under 18, use VedicSlokas with your parent&apos;s or guardian&apos;s permission.</li>
          <li>You can delete your account at any time in Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection id="use" title="Using VedicSlokas well">
        <p>Please don&apos;t:</p>
        <ul>
          <li>try to get into other people&apos;s accounts or data, or get around the site&apos;s limits and security;</li>
          <li>overload the site, or copy it in bulk with automated tools;</li>
          <li>use classes or any part of the site to harass, insult or mislead others.</li>
        </ul>
        <p>We may suspend accounts that do, after telling the account holder where we reasonably can.</p>
      </LegalSection>

      <LegalSection id="classes" title="Live classes">
        <ul>
          <li>Classes run on Google Meet or Zoom, whose own terms also apply while you are in a class.</li>
          <li>Be respectful to teachers and other students. The teacher may remove anyone who disrupts a class.</li>
          <li>Don&apos;t share class links outside VedicSlokas. Don&apos;t record classes, or share recordings, without the teacher&apos;s permission.</li>
          <li>Times can change or a class can be cancelled; the timetable in your dashboard is always up to date.</li>
        </ul>
      </LegalSection>

      <LegalSection id="plan" title="The monthly plan">
        <p>Plans are not open to everyone yet. When they are:</p>
        <ul>
          <li>You pay by UPI or bank transfer and tell us the transaction reference. Your plan starts once we find the payment in our statement.</li>
          <li>Each payment gives one month of access. Nothing renews automatically, and we never take money from you without you paying.</li>
          <li>Never pay anyone who contacts you claiming to be VedicSlokas. Pay only to the details shown on the Your plan page.</li>
          <li>
            <strong>Price and refunds:</strong> to be confirmed before plans open. They will be shown here and on the Your plan page.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="verses" title="The verses and our explanations">
        <p>
          The verses come from texts that are thousands of years old. Our transliterations, word meanings, translations and notes are our own work and are offered
          for learning. We check each verse carefully, and pages that have not been checked against a trusted edition yet say so, but mistakes are possible. If
          you find one, please tell us.
        </p>
        <p>You are welcome to share individual verses with a link back to VedicSlokas. Please don&apos;t republish the site&apos;s content in bulk.</p>
      </LegalSection>

      <LegalSection id="service" title="The service">
        <p>
          We work to keep VedicSlokas available and accurate, but we provide it as it is and can&apos;t promise it will never be interrupted. We may change or
          retire features; if a change affects something you paid for, we will tell you first.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes and contact">
        <p>
          When these terms change, we update the date above. For changes that matter, we will email account holders before they take effect. Questions? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
