"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { failureMessage, meFetch } from "@/lib/dashboard/client";
import type { PaymentRow } from "@/lib/subscriptions";
import { toast } from "@/lib/toast";

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 ? 2 : 0 })}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const STATUS: Record<PaymentRow["status"], string> = {
  pending: "border-gold/60 text-accent",
  verified: "border-[#6fbf8e]/60 text-[#9fdcb5]",
  rejected: "border-[#e0796a]/60 text-[#f0a89c]",
};

export function PaymentReviewTable({ payments }: { payments: PaymentRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const review = async (p: PaymentRow, approve: boolean) => {
    const what = `${rupees(p.amountPaise)} from ${p.name ?? "a deleted account"}, reference ${p.reference}`;
    if (!window.confirm(approve ? `Approve ${what}? Only if you found it in the statement.` : `Reject ${what}?`)) return;
    setBusy(p.id);
    try {
      await meFetch("/api/admin/payments/review", { body: { paymentId: p.id, approve } });
      toast(approve ? "Approved. One month added to their plan." : "Rejected.");
      router.refresh();
    } catch (error) {
      toast(failureMessage(error, "save that review"), { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  if (payments.length === 0) return <p className="rounded-2xl border border-line p-6 text-sm text-ink-muted">No payments reported yet.</p>;

  return (
    <ul className="space-y-3">
      {payments.map((p) => (
        <li key={p.id} className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{p.name ?? "Deleted account"}</p>
              {p.email && <p className="break-all text-sm text-ink-muted">{p.email}</p>}
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS[p.status]}`}>{p.status}</span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-muted">Amount</dt>
              <dd className="font-semibold text-ink">{rupees(p.amountPaise)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Method</dt>
              <dd className="text-ink">{p.mode === "upi" ? "UPI" : "Bank transfer"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Reference</dt>
              <dd className="break-all font-mono text-ink">{p.reference}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{p.reviewedAt ? "Reviewed" : "Reported"}</dt>
              <dd className="text-ink">{when(p.reviewedAt ?? p.createdAt)}</dd>
            </div>
          </dl>
          {p.status === "pending" && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void review(p, true)}
                className="min-h-11 rounded-full bg-saffron px-5 text-sm font-semibold text-on-saffron disabled:opacity-60"
              >
                {busy === p.id ? "Saving…" : "Found it: approve"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void review(p, false)}
                className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-[#e0796a] disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
