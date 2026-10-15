import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireRole } from "@/lib/session";
import { PaymentReviewTable } from "@/components/admin/PaymentReviewTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment verification" };

export default async function AdminPaymentsPage() {
  await requireRole(["admin"], "/admin/payments");
  const db = await getDb();
  const rows = await db.select({ id: schema.subscriptionPayment.id, userId: schema.subscriptionPayment.userId, name: schema.user.name, email: schema.user.email, amountPaise: schema.subscriptionPayment.amountPaise, mode: schema.subscriptionPayment.mode, utr: schema.subscriptionPayment.utr, status: schema.subscriptionPayment.status, createdAt: schema.subscriptionPayment.createdAt })
    .from(schema.subscriptionPayment)
    .innerJoin(schema.user, eq(schema.subscriptionPayment.userId, schema.user.id))
    .orderBy(desc(schema.subscriptionPayment.createdAt));
  return <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-5 py-12"><p className="eyebrow">VedicSlokas admin</p><h1 className="display text-4xl text-ink">Payment verification</h1><p className="max-w-2xl text-sm leading-6 text-ink-muted">Match each transaction reference against your bank or UPI statement before approving it. Approving a payment activates one month of subscription access.</p><PaymentReviewTable payments={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} /></main>;
}
