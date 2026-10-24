import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { UpgradeFlow } from "@/components/dashboard/UpgradeFlow";
import { dashboardUser } from "@/lib/dashboard/state";
import { env } from "@/lib/env";
import { canUseSubscriptions, getPlan, paymentDetails } from "@/lib/subscriptions";

export const metadata: Metadata = { title: "Your plan" };

/**
 * The plan and how to pay. Shown only to people allowed by SUBSCRIPTIONS; everyone else
 * gets a 404, as if it did not exist. The UPI QR is drawn here, on our own server, so the
 * payment address never passes through anyone else's service.
 */
export default async function UpgradePage() {
  const user = await dashboardUser("/dashboard/upgrade");
  if (!canUseSubscriptions(user)) notFound();
  const details = paymentDetails();
  const [plan, qr] = await Promise.all([
    getPlan(user.id),
    details.upi ? QRCode.toString(details.upi.link, { type: "svg", margin: 1, errorCorrectionLevel: "M" }) : Promise.resolve(null),
  ]);
  return (
    <UpgradeFlow
      plan={plan}
      details={details}
      qrSrc={qr ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}` : null}
      testing={env().SUBSCRIPTIONS === "testers"}
      classesFree={env().LIVE_CLASSES === "everyone"}
    />
  );
}
