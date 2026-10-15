import { audit } from "@/lib/audit";
import { exportAccount } from "@/lib/dashboard/data";
import { json, meRoute } from "@/lib/dashboard/api";
import { requestMeta } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

/** "Download my data": everything we hold about this student, as one JSON file. */
export const GET = meRoute(
  async ({ session }) => {
    const data = await exportAccount(session.user);
    const meta = await requestMeta();
    // No personal content in the log: who and when, plus sizes.
    await audit("data_exported", {
      userId: session.user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { favourites: data.favourites.length, progress: data.progress.length },
    });
    const day = data.exportedAt.slice(0, 10);
    return json(data, 200, { "Content-Disposition": `attachment; filename="vedicslokas-my-data-${day}.json"` });
  },
  { limit: "meExportByUser" },
);
