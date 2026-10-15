import type { Metadata } from "next";
import { PaymentReviewTable } from "@/components/admin/PaymentReviewTable";
import { requireRole } from "@/lib/session";
import { listPayments } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment review", robots: { index: false, follow: false } };

/** Admins check each reported payment against the bank or UPI statement, then approve or reject it. */
export default async function AdminPaymentsPage() {
  await requireRole(["admin"], "/admin/payments");
  const payments = await listPayments();
  const waiting = payments.filter((p) => p.status === "pending").length;
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 pb-16 pt-[calc(var(--nav-h)+2rem)]">
      <header>
        <p className="eyebrow">VedicSlokas admin</p>
        <h1 className="display mt-2 text-4xl text-ink">Payment review</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
          Find each reference in your bank or UPI statement, for the exact amount, before approving it. Approving adds one month to the student&apos;s plan;
          a reference can only ever be used once.
        </p>
        <p className="mt-3 text-sm font-semibold text-ink">{waiting === 1 ? "1 payment waiting" : `${waiting} payments waiting`}</p>
      </header>
      <PaymentReviewTable payments={payments} />
    </div>
  );
}
