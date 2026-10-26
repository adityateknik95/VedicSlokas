"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { MeError, failureMessage, meFetch } from "@/lib/dashboard/client";
import type { PaymentDetails, Plan } from "@/lib/subscriptions";
import { toast } from "@/lib/toast";

type Mode = "upi" | "bank";
type Step = "plans" | "payment";

const FREE = ["Every sloka, word by word", "Favourites, progress and your streak", "Sloka of the Day and Surprise me"];
/** Be honest about what exists: notes and courses are still being prepared. */
const SOON: { label: string; soon: boolean }[] = [
  { label: "PDF study notes (coming soon)", soon: true },
  { label: "Courses (coming soon)", soon: true },
];

const ERRORS: Record<string, string> = {
  invalid_reference: "That reference doesn't look right. Use the 12 digit UTR from your UPI app, or your bank's transaction reference.",
  already_pending: "You already have a payment waiting to be checked. We'll update your plan as soon as it is.",
  reference_used: "That transaction reference has already been submitted.",
};

const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const goldButton = "min-h-12 rounded-full bg-gold px-6 text-sm font-bold text-[#24170b] transition hover:brightness-110 disabled:opacity-60";

function Tick({ soon }: { soon?: boolean }) {
  return (
    <span aria-hidden="true" className={soon ? "text-ink-muted" : "text-accent"}>
      {soon ? "○" : "✓"}
    </span>
  );
}

/** "Current account mode": what the student has now, in one line, with a way to check again. */
function StatusBar({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  let mode = "Free";
  let detail = "Every verse is yours to read. The monthly plan adds the learning modules as they open.";
  if (plan.active && plan.expiresAt) {
    mode = "Monthly plan active";
    detail = `Active until ${date(plan.expiresAt)}. Paying again adds another month after that.`;
  }
  if (plan.pending) {
    if (!plan.active) mode = "Payment being checked";
    detail = `We received your reference ${plan.pending.reference} and are matching it with our statement. We'll update your plan as soon as we find it.`;
  } else if (!plan.active && plan.lastReviewed?.status === "rejected") {
    mode = "Payment not found";
    detail = "Your last reference didn't match a payment in our statement. If you did pay, choose the monthly plan again and send the correct reference.";
  }
  return (
    <div role="status" className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-muted">Current account mode</span>
        <strong className="rounded-full bg-surface-2 px-3 py-1 text-sm text-ink">{mode}</strong>
        <button
          type="button"
          onClick={() => startCheck(() => router.refresh())}
          disabled={checking}
          className="ml-auto min-h-10 rounded-full border border-line px-4 text-xs font-semibold text-ink hover:border-gold disabled:opacity-60"
        >
          {checking ? "Checking…" : "Refresh status"}
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{detail}</p>
    </div>
  );
}

function StepMark({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <li aria-current={active ? "step" : undefined} className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold ${active ? "border-gold bg-gold text-[#24170b]" : "border-line text-ink-muted"}`}
      >
        {number}
      </span>
      <span className={`text-sm ${active ? "font-semibold text-ink" : "text-ink-muted"}`}>
        <span className="sr-only">Step {number}: </span>
        {label}
      </span>
    </li>
  );
}

/** Choose a plan, then pay by UPI or bank transfer and report the reference. */
export function UpgradeFlow({ plan, details, qrSrc, testing, classesFree }: { plan: Plan; details: PaymentDetails; qrSrc: string | null; testing: boolean; classesFree: boolean }) {
  const free = classesFree ? [...FREE, "Live classes, free while we're starting out"] : FREE;
  const paid = [{ label: "Everything in Free", soon: false }, ...(classesFree ? [] : [{ label: "Live classes", soon: false }]), ...SOON];
  const router = useRouter();
  const ids = useId();
  const methods: Mode[] = [...(details.upi ? (["upi"] as const) : []), ...(details.bank ? (["bank"] as const) : [])];
  const [step, setStep] = useState<Step>("plans");
  const [mode, setMode] = useState<Mode>(methods[0] ?? "upi");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Moving between steps puts keyboard and screen reader focus on the new step's heading.
  useEffect(() => {
    if (moved.current) stepHeading.current?.focus();
  }, [step]);
  const go = (next: Step) => {
    moved.current = true;
    setError(null);
    setStep(next);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      toast("Couldn't copy. Please select it and copy by hand.", { tone: "error" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await meFetch("/api/me/plan", { body: { mode, reference } });
      setReference("");
      go("plans");
      toast("Thank you. We'll activate your plan once we find the payment.");
      router.refresh();
    } catch (err) {
      setError(err instanceof MeError && ERRORS[err.code] ? ERRORS[err.code] : failureMessage(err, "send your reference"));
    } finally {
      setSending(false);
    }
  };

  const canPay = !plan.pending;

  return (
    <div className="space-y-8">
      {testing && <p className="rounded-2xl border border-dashed border-gold/60 p-3 text-sm text-ink-muted">Testing mode: only admins and invited testers can see this page.</p>}

      <header>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink">
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>
        <p className="eyebrow mt-4">Your learning journey</p>
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">Choose how you learn</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
          The verses stay free for everyone. The monthly plan supports the work and unlocks the learning modules as they open.
        </p>
      </header>

      <StatusBar plan={plan} />

      <ol aria-label="Checkout progress" className="flex items-center gap-3">
        <StepMark number={1} label="Choose plan" active={step === "plans"} />
        <li aria-hidden="true" className="h-px flex-1 bg-line" />
        <StepMark number={2} label="Payment" active={step === "payment"} />
      </ol>

      {step === "plans" || !canPay ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby={`${ids}-free`} className="dash-card flex flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Explore first</p>
                <h2 id={`${ids}-free`} ref={step === "plans" ? stepHeading : undefined} tabIndex={-1} className="display mt-2 text-3xl text-ink outline-none">
                  Free
                </h2>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-muted">₹0</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-muted">Everything you need to begin a daily practice, for as long as you like.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-ink">
              {free.map((f) => (
                <li key={f} className="flex gap-3">
                  <Tick /> {f}
                </li>
              ))}
            </ul>
            {!plan.active && <p className="mt-8 flex min-h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-ink-muted">Your current plan</p>}
          </section>

          <section aria-labelledby={`${ids}-paid`} className="dash-card relative flex flex-col overflow-hidden border-gold/70 p-6 sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Full access</p>
                <h2 id={`${ids}-paid`} className="display mt-2 text-3xl text-ink">
                  Monthly
                </h2>
              </div>
              <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-[#24170b]">Best value</span>
            </div>
            <div className="relative mt-5 flex items-baseline gap-2">
              <span className="display text-5xl text-ink">₹{details.priceInr}</span>
              <span className="text-sm text-ink-muted">/ month</span>
            </div>
            <p className="relative mt-3 text-sm leading-6 text-ink-muted">One simple plan. Each payment covers a month; nothing renews by itself.</p>
            <ul className="relative mt-6 flex-1 space-y-3 text-sm text-ink">
              {paid.map((f) => (
                <li key={f.label} className={`flex gap-3 ${f.soon ? "text-ink-muted" : ""}`}>
                  <Tick soon={f.soon} /> {f.label}
                </li>
              ))}
            </ul>
            {canPay ? (
              <button type="button" onClick={() => go("payment")} className={`relative mt-8 ${goldButton}`}>
                {plan.active ? `Add a month · ₹${details.priceInr}` : `Choose monthly plan · ₹${details.priceInr}`}
              </button>
            ) : (
              <p className="relative mt-8 flex min-h-12 items-center justify-center rounded-full border border-gold/50 px-5 text-sm font-semibold text-ink">Payment being checked</p>
            )}
          </section>
        </div>
      ) : (
        <section aria-labelledby={`${ids}-pay`} className="dash-card p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Monthly plan</p>
              <h2 id={`${ids}-pay`} ref={stepHeading} tabIndex={-1} className="display mt-2 text-3xl text-ink outline-none">
                Pay ₹{details.priceInr}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">Pay exactly ₹{details.priceInr}, then tell us the transaction reference so we can match it.</p>
            </div>
            <button type="button" onClick={() => go("plans")} className="min-h-11 rounded-full border border-line px-4 text-sm text-ink hover:border-gold">
              Change plan
            </button>
          </div>

          {methods.length === 0 ? (
            <p className="mt-7 rounded-xl border border-line p-4 text-sm text-ink-muted">Payment details aren&apos;t set up yet. Please check back soon.</p>
          ) : (
            <>
              <div role="group" aria-label="How you will pay" className="mt-7 grid gap-3 sm:grid-cols-2">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${mode === m ? "border-gold bg-gold/10" : "border-line hover:border-gold/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg font-bold text-accent">
                        {m === "upi" ? (
                          "₹"
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9h18L12 3 3 9ZM5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M2 18h20" />
                          </svg>
                        )}
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">{m === "upi" ? "UPI QR" : "Bank transfer"}</span>
                        <span className="mt-1 block text-xs text-ink-muted">{m === "upi" ? "Scan with PhonePe, Google Pay or any UPI app" : "Pay through your bank app or net banking"}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {mode === "upi" && details.upi && (
                <div className="mt-6 grid gap-6 rounded-2xl border border-line p-5 sm:grid-cols-[240px_1fr] sm:items-center sm:p-6">
                  <div className="mx-auto grid min-h-[240px] w-full max-w-[240px] place-items-center rounded-xl bg-white p-3">
                    {qrSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrSrc} alt={`UPI QR code to pay ₹${details.priceInr} to ${details.upi.name}`} width={216} height={216} className="h-[216px] w-[216px]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Scan and pay ₹{details.priceInr}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      Scan the QR with any UPI app and pay ₹{details.priceInr}. Check that the name shown is <strong className="text-ink">{details.upi.name}</strong> before you pay.
                    </p>
                    <div className="mt-4 rounded-xl border border-line p-3">
                      <p className="text-xs text-ink-muted">UPI ID</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <code className="break-all text-sm text-ink">{details.upi.id}</code>
                        <button
                          type="button"
                          onClick={() => void copy(details.upi?.id ?? "")}
                          className="min-h-10 shrink-0 rounded-full border border-line px-3 text-xs font-semibold text-ink hover:border-gold"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    {/* upi:// links open a UPI app on phones; on a computer, scan the QR instead. */}
                    <a href={details.upi.link} className={`mt-4 inline-flex items-center sm:hidden ${goldButton}`}>
                      Open my UPI app
                    </a>
                  </div>
                </div>
              )}

              {mode === "bank" && details.bank && (
                <div className="mt-6 rounded-2xl border border-line p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-ink">Bank account details</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">Use these in your bank app or net banking. Transfer exactly ₹{details.priceInr} and check the account name before sending.</p>
                  <dl className="mt-5 divide-y divide-line rounded-xl border border-line px-4">
                    {[
                      ["Account holder", details.bank.holder],
                      ["Bank", details.bank.name],
                      ["Account number", details.bank.account],
                      ["IFSC", details.bank.ifsc],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                        <dt className="text-ink-muted">{label}</dt>
                        <dd className="flex items-center gap-3 font-medium text-ink">
                          <span className="break-all">{value}</span>
                          {label === "Account number" && (
                            <button type="button" onClick={() => void copy(value)} className="min-h-10 rounded-full border border-line px-3 text-xs font-semibold hover:border-gold">
                              Copy
                            </button>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <form onSubmit={(e) => void submit(e)} className="mt-6 rounded-2xl border border-line p-5 sm:p-6">
                <h3 className="font-semibold text-ink">After you pay</h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">Enter the transaction reference so we can match your payment.</p>
                <label htmlFor={`${ids}-ref`} className="mt-4 block text-sm font-medium text-ink">
                  Transaction reference (UTR)
                </label>
                <p id={`${ids}-ref-hint`} className="mt-1 text-xs text-ink-muted">
                  {mode === "upi" ? "In your UPI app, open the payment: the UTR is a 12 digit number." : "Your bank shows it on the transfer receipt."}
                </p>
                <input
                  id={`${ids}-ref`}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required
                  maxLength={60}
                  autoComplete="off"
                  inputMode={mode === "upi" ? "numeric" : "text"}
                  placeholder="Enter transaction reference"
                  aria-describedby={`${ids}-ref-hint${error ? ` ${ids}-ref-error` : ""}`}
                  aria-invalid={error ? true : undefined}
                  className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4 font-mono text-sm tracking-wider text-ink outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-ink-muted focus:border-gold"
                />
                {error && (
                  <p id={`${ids}-ref-error`} role="alert" className="mt-3 text-sm text-[#f0a89c]">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={sending || !reference.trim()} className={`mt-4 ${goldButton}`}>
                  {sending ? "Sending…" : "Submit payment reference"}
                </button>
                <p className="mt-4 text-xs leading-5 text-ink-muted">
                  Your plan starts once we find the payment in our statement. We never ask for card numbers, OTPs or your UPI PIN.
                </p>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
