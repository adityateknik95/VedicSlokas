"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PaymentMode = "upi" | "bank";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME ?? "VedicSlokas";
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME ?? "";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "";
const BANK_IFSC = process.env.NEXT_PUBLIC_BANK_IFSC ?? "";
const BANK_HOLDER = process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER ?? UPI_NAME;

function StepMark({ number, active }: { number: number; active: boolean }) {
  return <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold ${active ? "border-gold bg-gold text-[#24170b]" : "border-line text-ink-muted"}`}>{number}</span>;
}

export function UpgradeFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"plans" | "payment">("plans");
  const [mode, setMode] = useState<PaymentMode>("upi");
  const [utr, setUtr] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [planStatus, setPlanStatus] = useState<string>("loading");
  const [paymentStatus, setPaymentStatus] = useState<string>("none");
  const [paymentBusy, setPaymentBusy] = useState(false);

  async function refreshPlan() {
    try {
      const response = await fetch("/api/subscription", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) { setPlanStatus(data.plan?.status ?? "none"); setPaymentStatus(data.plan?.payment?.status ?? "none"); }
    } catch { setPlanStatus("unknown"); }
  }

  useEffect(() => { void refreshPlan(); }, []);

  async function startFreeTrial() {
    setNotice("");
    const response = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start_trial" }) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error ?? "Could not start the free trial."); return; }
    setPlanStatus("trial");
    router.push("/dashboard");
    router.refresh();
  }

  const upiLink = useMemo(() => {
    if (!UPI_ID) return "";
    const params = new URLSearchParams({ pa: UPI_ID, pn: UPI_NAME, am: "79.00", cu: "INR", tn: "VedicSlokas monthly subscription" });
    return `upi://pay?${params.toString()}`;
  }, []);
  const qrUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}` : "";

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Please select and copy the payment detail manually.");
    }
  }

  async function submitPaymentProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!utr.trim()) { setNotice("Enter the UPI transaction ID / UTR after making the payment."); return; }
    setPaymentBusy(true); setNotice("");
    try {
      const response = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit_payment", mode, utr }) });
      const data = await response.json();
      if (!response.ok) { setNotice(data.error ?? "Could not submit payment details."); return; }
      setPlanStatus("pending");
      setPaymentStatus("pending");
      setNotice("Payment reference submitted. Your account will switch to Subscription mode after the transaction is verified. Please refresh this page after verification.");
    } catch { setNotice("Network error. Please try again."); }
    finally { setPaymentBusy(false); }
  }

  return (
    <div className="dash-page space-y-8">
      <header className="dash-enter">
        <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink">
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>
        <p className="eyebrow mt-5">Your learning journey</p>
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">Choose how you learn</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">Start with a small taste of VedicSlokas, or unlock the complete learning experience with one simple monthly plan.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="text-sm text-ink-muted">Current account mode</span>
          <strong className="rounded-full bg-surface-2 px-3 py-1 text-sm text-ink">{planStatus === "active" ? "Subscription active" : planStatus === "trial" ? "Free Trial" : planStatus === "pending" ? "Payment verification pending" : planStatus === "expired" ? "Plan expired / rejected" : planStatus === "none" ? "No plan selected" : "Checking status…"}</strong>
          <span className="text-xs text-ink-muted">{paymentStatus === "verified" ? "Payment transaction completed" : paymentStatus === "pending" ? "Payment submitted · awaiting verification" : paymentStatus === "rejected" ? "Payment was rejected" : ""}</span><button type="button" onClick={() => void refreshPlan()} className="ml-auto min-h-9 rounded-full border border-line px-3 text-xs font-semibold text-ink hover:border-gold">Refresh status</button>
        </div>
      </header>

      <div className="flex items-center gap-3" aria-label="Checkout progress">
        <StepMark number={1} active={step === "plans"} />
        <span className={`text-sm ${step === "plans" ? "font-semibold text-ink" : "text-ink-muted"}`}>Choose plan</span>
        <span className="h-px flex-1 bg-line" />
        <StepMark number={2} active={step === "payment"} />
        <span className={`text-sm ${step === "payment" ? "font-semibold text-ink" : "text-ink-muted"}`}>Payment</span>
      </div>

      {step === "plans" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="dash-card flex flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow">Explore first</p><h2 className="display mt-2 text-3xl text-ink">Free Trial</h2></div>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-muted">₹0</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-muted">A simple way to begin your daily practice and experience the VedicSlokas learning space.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-ink">
              <li className="flex gap-3"><span className="text-accent">✓</span> Access to up to 7 selected slokas</li>
              <li className="flex gap-3"><span className="text-accent">✓</span> Read verses and their meanings</li>
              <li className="flex gap-3"><span className="text-accent">✓</span> Try the basic learning experience</li>
              <li className="flex gap-3"><span className="text-ink-muted">—</span> Full classes, PDFs, notes and courses are not included</li>
            </ul>
            <button type="button" onClick={() => { void startFreeTrial(); }} className="mt-8 min-h-12 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-surface-2">Start Free Trial</button>
            {notice && step === "plans" && <p role="status" className="mt-3 text-xs leading-5 text-ink-muted">{notice}</p>}
          </section>

          <section className="dash-card relative flex flex-col overflow-hidden border-gold/70 p-6 sm:p-8">
            <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div><p className="eyebrow">Full access</p><h2 className="display mt-2 text-3xl text-ink">Monthly Subscription</h2></div>
              <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-[#24170b]">Best value</span>
            </div>
            <div className="relative mt-5 flex items-baseline gap-2"><span className="display text-5xl text-ink">₹79</span><span className="text-sm text-ink-muted">/ month</span></div>
            <p className="relative mt-3 text-sm leading-6 text-ink-muted">Keep learning without the trial limit. One monthly plan for your complete study routine.</p>
            <ul className="relative mt-6 flex-1 space-y-3 text-sm text-ink">
              <li className="flex gap-3"><span className="text-accent">✓</span> Full sloka library</li>
              <li className="flex gap-3"><span className="text-accent">✓</span> Live classes</li>
              <li className="flex gap-3"><span className="text-accent">✓</span> PDFs and study notes</li>
              <li className="flex gap-3"><span className="text-accent">✓</span> Courses and premium learning materials</li>
              <li className="flex gap-3"><span className="text-accent">✓</span> Continue learning beyond the 7-sloka trial</li>
            </ul>
            <button type="button" onClick={() => { setNotice(""); setStep("payment"); }} className="relative mt-8 min-h-12 rounded-full bg-gold px-5 text-sm font-bold text-[#24170b] transition hover:brightness-110">Choose Monthly Plan · ₹79</button>
          </section>
        </div>
      ) : (
        <section className="dash-card p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="eyebrow">Monthly subscription</p><h2 className="display mt-2 text-3xl text-ink">Pay ₹79</h2><p className="mt-2 text-sm text-ink-muted">Choose one of the two manual payment methods below.</p></div>
            <button type="button" onClick={() => { setStep("plans"); setNotice(""); }} className="min-h-10 rounded-full border border-line px-4 text-sm text-ink hover:border-gold">Change plan</button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setMode("upi"); setNotice(""); }} aria-pressed={mode === "upi"} className={`rounded-2xl border p-4 text-left transition ${mode === "upi" ? "border-gold bg-gold/10" : "border-line hover:border-gold/60"}`}>
              <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-lg font-bold text-accent">₹</span><span><span className="block font-semibold text-ink">PhonePe / UPI QR</span><span className="mt-1 block text-xs text-ink-muted">Scan using PhonePe, GPay or another UPI app</span></span></span>
            </button>
            <button type="button" onClick={() => { setMode("bank"); setNotice(""); }} aria-pressed={mode === "bank"} className={`rounded-2xl border p-4 text-left transition ${mode === "bank" ? "border-gold bg-gold/10" : "border-line hover:border-gold/60"}`}>
              <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-accent"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18L12 3 3 9ZM5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M2 18h20" /></svg></span><span><span className="block font-semibold text-ink">Bank Transfer</span><span className="mt-1 block text-xs text-ink-muted">Pay through your bank app or net banking</span></span></span>
            </button>
          </div>

          {mode === "upi" ? (
            <div className="mt-6 grid gap-6 rounded-2xl border border-line p-5 sm:grid-cols-[240px_1fr] sm:items-center sm:p-6">
              <div className="mx-auto grid min-h-[240px] w-full max-w-[240px] place-items-center rounded-xl bg-white p-3 text-center">
                {qrUrl ? <img src={qrUrl} alt="UPI payment QR code for the ₹79 VedicSlokas subscription" width={216} height={216} className="h-[216px] w-[216px]" /> : <div className="px-3 text-sm text-slate-700"><div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-lg border-2 border-dashed border-slate-400 text-3xl">▦</div><strong>UPI QR will appear here</strong><p className="mt-2 text-xs">Set NEXT_PUBLIC_UPI_ID in your environment settings to generate your real payment QR.</p></div>}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">Scan and pay ₹79</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">Scan the QR with PhonePe or Google Pay and complete the ₹79 payment. On a phone, use the UPI app if available. Please verify the recipient name before paying.</p>
                {UPI_ID ? <div className="mt-4 rounded-xl border border-line p-3"><p className="text-xs text-ink-muted">UPI ID</p><div className="mt-1 flex items-center justify-between gap-3"><code className="break-all text-sm text-ink">{UPI_ID}</code><button type="button" onClick={() => copyText(UPI_ID)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-ink">{copied ? "Copied" : "Copy"}</button></div></div> : <p className="mt-4 rounded-xl border border-line p-3 text-xs leading-5 text-ink-muted">Payment setup needed: add your real UPI ID and display name to the environment variables before publishing.</p>}
                {upiLink && <a href={upiLink} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-[#24170b]">Open PhonePe / Google Pay</a>}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-line p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-ink">Bank account details</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">Use these details in your bank app or net-banking portal. Transfer exactly ₹79 and confirm the account name before sending.</p>
              {BANK_NAME && BANK_ACCOUNT && BANK_IFSC ? <dl className="mt-5 divide-y divide-line rounded-xl border border-line px-4">{[["Account holder", BANK_HOLDER], ["Bank", BANK_NAME], ["Account number", BANK_ACCOUNT], ["IFSC", BANK_IFSC]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt className="text-ink-muted">{label}</dt><dd className="break-all font-medium text-ink">{value}</dd></div>)}</dl> : <p className="mt-5 rounded-xl border border-line p-4 text-sm leading-6 text-ink-muted">Bank details are not configured yet. Add the real account holder, bank name, account number and IFSC in your deployment environment variables before accepting payments.</p>}
              {BANK_ACCOUNT && <button type="button" onClick={() => copyText(BANK_ACCOUNT)} className="mt-3 rounded-full border border-line px-4 py-2 text-xs text-ink">{copied ? "Copied" : "Copy account number"}</button>}
            </div>
          )}

          <form onSubmit={submitPaymentProof} className="mt-6 rounded-2xl border border-line p-5 sm:p-6">
            <h3 className="font-semibold text-ink">After you pay</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">Enter the transaction reference / UTR so the team can match your payment.</p>
            <label htmlFor="payment-utr" className="mt-4 block text-sm font-medium text-ink">Transaction ID / UTR</label>
            <input id="payment-utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter transaction reference" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-gold" />
            <button type="submit" disabled={paymentBusy} className="mt-4 min-h-12 rounded-full bg-gold px-6 text-sm font-bold text-[#24170b] hover:brightness-110 disabled:opacity-60">{paymentBusy ? "Submitting…" : "Submit payment reference"}</button>
            {notice && <p role="status" className="mt-4 rounded-xl border border-line bg-surface p-3 text-sm leading-6 text-ink-muted">{notice}</p>}
            <p className="mt-4 text-xs leading-5 text-ink-muted">Manual payment only. Your reference is stored as pending until an administrator verifies the payment. Never enter a card number, expiry date or CVC here.</p>
          </form>
        </section>
      )}
    </div>
  );
}
