"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Payment = { id: string; userId: string; name: string; email: string; amountPaise: number; mode: string; utr: string; status: "pending" | "verified" | "rejected"; createdAt: string };
export function PaymentReviewTable({ payments }: { payments: Payment[] }) {
  const [busy, setBusy] = useState<string>("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  async function review(id: string, verified: boolean) {
    setBusy(id); setNotice("");
    try {
      const response = await fetch(`/api/admin/subscription/${id}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified }) });
      const data = await response.json();
      if (!response.ok) { setNotice(data.error ?? "Could not update payment."); return; }
      setNotice(verified ? "Payment verified. Subscription activated for one month." : "Payment rejected.");
      router.refresh();
    } catch { setNotice("Network error. Please retry."); }
    finally { setBusy(""); }
  }
  if (!payments.length) return <div className="rounded-2xl border border-line p-6 text-sm text-ink-muted">No payment submissions yet.</div>;
  return <div className="space-y-4">{notice && <p role="status" className="rounded-xl border border-line p-3 text-sm text-ink">{notice}</p>}{payments.map((p) => <article key={p.id} className="rounded-2xl border border-line p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-ink">{p.name}</h2><p className="text-sm text-ink-muted">{p.email}</p></div><span className="rounded-full border border-line px-3 py-1 text-xs font-semibold capitalize text-ink">{p.status}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-ink-muted">Amount</dt><dd className="font-semibold text-ink">₹{(p.amountPaise / 100).toFixed(2)}</dd></div><div><dt className="text-ink-muted">Method</dt><dd className="font-semibold text-ink">{p.mode === "upi" ? "PhonePe / Google Pay UPI" : "Bank transfer"}</dd></div><div><dt className="text-ink-muted">Transaction reference / UTR</dt><dd className="break-all font-mono text-ink">{p.utr}</dd></div><div><dt className="text-ink-muted">Submitted</dt><dd className="text-ink">{new Date(p.createdAt).toLocaleString("en-IN")}</dd></div></dl>{p.status === "pending" && <div className="mt-5 flex flex-wrap gap-3"><button disabled={!!busy} onClick={() => void review(p.id, true)} className="min-h-10 rounded-full bg-gold px-4 text-sm font-bold text-[#24170b] disabled:opacity-50">{busy === p.id ? "Saving…" : "Verify payment & activate"}</button><button disabled={!!busy} onClick={() => void review(p.id, false)} className="min-h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50">Reject</button></div>}</article>)}</div>;
}
