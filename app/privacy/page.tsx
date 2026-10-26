import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What VedicSlokas keeps about you, why, who helps us run the site, and how to get a copy or delete it.",
  alternates: { canonical: "/privacy" },
};

// TODO(legal): have this reviewed by a qualified professional before paid plans open to everyone.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="26 October 2026"
      intro={
        <p>
          You can read every verse on VedicSlokas without an account. We use no analytics, no ads and no tracking. If you create an account, we keep only what the
          site needs to work for you, and we never sell your data.
        </p>
      }
    >
      <LegalSection id="what" title="What we keep">
        <ul>
          <li>
            <strong>Your account:</strong> your name and email address. If you sign in with Google, also your Google account ID and profile picture. There are no
            passwords.
          </li>
          <li>
            <strong>Your learning:</strong> the slokas you save as favourites, the ones you open and mark as learned, the days you were active (for your streak),
            your preferences (interests, timezone, motion, daily email choice) and which coming-soon features you asked to hear about.
          </li>
          <li>
            <strong>Live classes:</strong> which classes you joined, so teachers see how many came.
          </li>
          <li>
            <strong>Payments (when plans are open):</strong> the payment method you chose (UPI or bank transfer), the amount and the transaction reference (UTR) you
            give us, so we can match it with our statement. We never ask for or store card numbers, OTPs or your UPI PIN.
          </li>
          <li>
            <strong>Security records:</strong> sign-in events (for example a link requested or used), with the time, IP address and browser, to protect your
            account and stop abuse.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="teachers" title="Teachers and Google Calendar">
        <p>
          A teacher can connect their Google account so the site creates a Google Calendar event with a Meet link for each class. We ask only for permission to
          create and change calendar events, and we keep the access key encrypted. Disconnecting (on Manage classes) or deleting the account removes it here and
          asks Google to cancel it. You can also remove access any time in your Google account settings.
        </p>
      </LegalSection>

      <LegalSection id="classes" title="Live classes">
        <p>
          Classes take place on Google Meet or Zoom. When you join, you leave VedicSlokas for that service, and its own privacy policy applies to what happens in the
          meeting (for example your name, camera and microphone). Some classes may be recorded by the teacher; recordings are shared only with students of
          VedicSlokas.
        </p>
      </LegalSection>

      <LegalSection id="who" title="Who helps us run the site">
        <p>These services process data for us, only to provide their part of the site:</p>
        <ul>
          <li>
            <strong>Vercel</strong> hosts the website.
          </li>
          <li>
            <strong>Neon</strong> hosts the database.
          </li>
          <li>
            <strong>Resend</strong> sends our emails (sign-in links and account notices).
          </li>
          <li>
            <strong>Upstash</strong> counts requests to stop abuse (rate limits).
          </li>
          <li>
            <strong>Google</strong> provides Google sign-in, and Calendar and Meet for classes.
          </li>
          <li>
            <strong>Sentry</strong> receives error reports when something breaks. We remove sign-in links, cookies and personal details from these reports before
            they are sent.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          We use only the cookies the site needs: one that keeps you signed in, one small note that you are signed in (so pages can show &ldquo;Dashboard&rdquo;),
          one that remembers whether the dashboard sidebar is collapsed, and, for teachers, a short-lived one while they connect Google. Your theme and
          favourites (when signed out) are kept in your own browser. No advertising or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection id="keep" title="How long we keep it">
        <p>
          We keep your account and learning data while you have an account. When you delete your account, it is removed straight away, including every sign-in
          session; personal details in our security records are erased. If you made payments, we keep the payment amount and reference without anything that
          identifies you, because we need them for our accounts.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="Your choices">
        <ul>
          <li>
            <strong>See it all:</strong> Settings, then Download my data, gives you everything we hold about you as one file.
          </li>
          <li>
            <strong>Correct it:</strong> change your name and preferences in Settings.
          </li>
          <li>
            <strong>Delete it:</strong> Settings, then Delete account. For your safety it needs a sign-in from the last hour.
          </li>
          <li>
            <strong>Ask us:</strong> write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with any question or request about your data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>Anyone can read the verses. If you are under 18, please create an account only with your parent&apos;s or guardian&apos;s permission, and let them know they can write to us about your data.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>When we change this policy, we update the date above. For changes that matter, we will email account holders before they take effect.</p>
      </LegalSection>
    </LegalPage>
  );
}
