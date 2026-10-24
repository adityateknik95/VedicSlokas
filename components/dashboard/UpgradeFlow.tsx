"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { MeError, failureMessage, meFetch } from "@/lib/dashboard/client";
import type { PaymentDetails, Plan } from "@/lib/subscriptions";
import { toast } from "@/lib/toast";

type Mode = "upi" | "bank";

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

function Tick({ soon }: { soon?: boolean }) {
  return (
    <span aria-hidden="true" className={soon ? "text-ink-muted" : "text-accent"}>
      {soon ? "○" : "✓"}
    </span>
  );
}

function Status({ plan }: { plan: Plan }) {
  let title = "Free";
  let body = "Every verse is yours to read. The monthly plan adds the learning modules as they open.";
  if (plan.active && plan.expiresAt) {
    title = "Monthly plan · active";
    body = `Active until ${date(plan.expiresAt)}. Paying again adds another month after that.`;
  }
  if (plan.pending) {
    if (!plan.active) title = "Payment being checked";
    body = `We received your reference ${plan.pending.reference} and are matching it with our statement. We'll update your plan as soon as we find it.`;
  } else if (!plan.active && plan.lastReviewed?.status === "rejected") {
    title = "We couldn't find your payment";
    body = "Your last reference didn't match a payment in our statement. If you did pay, send the correct reference below.";
  }
  return (
    <div role="status" className="dash-card p-5 sm:p-6">
      <p className="eyebrow">Your plan</p>
      <p className="display mt-2 text-2xl text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
    </div>
  );
}

/** Free and monthly side by side, then how to pay and where to report the reference. */
export function UpgradeFlow({ plan, details, qrSrc, testing, classesFree }: { plan: Plan; details: PaymentDetails; qrSrc: string | null; testing: boolean; classesFree: boolean }) {
  const free = classesFree ? [...FREE, "Live classes, free while we're starting out"] : FREE;
  const paid = [{ label: "Everything in Free", soon: false }, ...(classesFree ? [] : [{ label: "Live classes", soon: false }]), ...SOON];
  const router = useRouter();
  const ids = useId();
  const methods: Mode[] = [...(details.upi ? (["upi"] as const) : []), ...(details.bank ? (["bank"] as const) : [])];
  const [paying, setPaying] = useState(false);
  const [mode, setMode] = useState<Mode>(methods[0] ?? "upi");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
      setPaying(false);
      toast("Thank you. We'll activate your plan once we find the payment.");
      router.refresh();
    } catch (err) {
      setError(err instanceof MeError && ERRORS[err.code] ? ERRORS[err.code] : failureMessage(err, "send your reference"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {testing && <p className="rounded-2xl border border-dashed border-gold/60 p-3 text-sm text-ink-muted">Testing mode: only admins and invited testers can see this page.</p>}
      <header>
        <h1 className="display text-4xl text-ink sm:text-5xl">Your plan</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">The verses stay free for everyone. The monthly plan supports the work and unlocks the learning modules as they open.</p>
      </header>

      <Status plan={plan} />

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby={`${ids}-free`} className="dash-card flex flex-col p-6">
          <h2 id={`${ids}-free`} className="display text-3xl text-ink">
            Free
          </h2>
          <p className="mt-1 text-ink-muted">₹0, always</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink">
            {free.map((f) => (
              <li key={f} className="flex gap-3">
                <Tick /> {f}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby={`${ids}-paid`} className="dash-card flex flex-col border-gold/60 p-6">
          <h2 id={`${ids}-paid`} className="display text-3xl text-ink">
            Monthly
          </h2>
          <p className="mt-1 text-ink-muted">
            <span className="display text-2xl text-ink">₹{details.priceInr}</span> a month
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink">
            {paid.map((f) => (
              <li key={f.label} className={`flex gap-3 ${f.soon ? "text-ink-muted" : ""}`}>
                <Tick soon={f.soon} /> {f.label}
              </li>
            ))}
          </ul>
          {!plan.pending && (
            <button
              type="button"
              aria-expanded={paying}
              aria-controls={`${ids}-pay`}
              onClick={() => setPaying((p) => !p)}
              className="mt-6 min-h-12 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron"
            >
              {plan.active ? `Add a month · ₹${details.priceInr}` : `Pay ₹${details.priceInr}`}
            </button>
          )}
        </section>
      </div>

      {paying && !plan.pending && (
        <section id={`${ids}-pay`} aria-labelledby={`${ids}-pay-title`} className="dash-card space-y-6 p-5 sm:p-8">
          <div>
            <h2 id={`${ids}-pay-title`} className="display text-3xl text-ink">
              Pay ₹{details.priceInr}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Pay exactly ₹{details.priceInr}, then tell us the transaction reference so we can match it.</p>
          </div>

          {methods.length === 0 ? (
            <p className="rounded-xl border border-line p-4 text-sm text-ink-muted">Payment details aren&apos;t set up yet. Please check back soon.</p>
          ) : (
            <>
              {methods.length > 1 && (
                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">How you will pay</legend>
                  {methods.map((m) => (
                    <label
                      key={m}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${mode === m ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-muted"}`}
                    >
                      <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="accent-[var(--saffron)]" />
                      {m === "upi" ? "UPI" : "Bank transfer"}
                    </label>
                  ))}
                </fieldset>
              )}

              {mode === "upi" && details.upi && (
                <div className="grid items-center gap-6 sm:grid-cols-[13rem_1fr]">
                  {qrSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrSrc} alt={`UPI QR code to pay ₹${details.priceInr} to ${details.upi.name}`} width={208} height={208} className="mx-auto rounded-xl bg-white p-2" />
                  )}
                  <div className="space-y-3 text-sm">
                    <p className="text-ink-muted">Scan with any UPI app. Check that the name shown is {details.upi.name} before you pay.</p>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                      <code className="break-all text-ink">{details.upi.id}</code>
                      <button
                        type="button"
                        onClick={() => void copy(details.upi?.id ?? "")}
                        className="ml-auto min-h-10 rounded-full border border-line px-4 text-xs font-semibold text-ink hover:border-gold"
                      >
                        Copy UPI ID
                      </button>
                    </div>
                    <a href={details.upi.link} className="inline-flex min-h-11 items-center rounded-full border border-gold/60 px-5 font-semibold text-ink sm:hidden">
                      Open my UPI app
                    </a>
                  </div>
                </div>
              )}

              {mode === "bank" && details.bank && (
                <dl className="divide-y divide-line rounded-xl border border-line px-4 text-sm">
                  {[
                    ["Account holder", details.bank.holder],
                    ["Bank", details.bank.name],
                    ["Account number", details.bank.account],
                    ["IFSC", details.bank.ifsc],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-3">
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
              )}

              <form onSubmit={(e) => void submit(e)} className="space-y-3 border-t border-line pt-6">
                <label htmlFor={`${ids}-ref`} className="block text-sm font-medium text-ink">
                  Transaction reference (UTR)
                </label>
                <p id={`${ids}-ref-hint`} className="text-xs text-ink-muted">
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
                  aria-describedby={`${ids}-ref-hint${error ? ` ${ids}-ref-error` : ""}`}
                  aria-invalid={error ? true : undefined}
                  className="h-12 w-full rounded-xl border border-line bg-surface px-4 font-mono tracking-wider text-ink focus:border-gold"
                />
                {error && (
                  <p id={`${ids}-ref-error`} role="alert" className="text-sm text-[#f0a89c]">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={sending || !reference.trim()} className="min-h-12 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron disabled:opacity-60">
                  {sending ? "Sending…" : "I have paid: send reference"}
                </button>
                <p className="text-xs text-ink-muted">We never ask for card numbers, OTPs or your UPI PIN.</p>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
