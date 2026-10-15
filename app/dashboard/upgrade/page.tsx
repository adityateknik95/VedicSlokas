import type { Metadata } from "next";
import { UpgradeFlow } from "@/components/dashboard/UpgradeFlow";

export const metadata: Metadata = { title: "Upgrade your plan" };

export default function UpgradePage() {
  return <UpgradeFlow />;
}
