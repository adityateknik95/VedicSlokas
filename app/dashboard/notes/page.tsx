import type { Metadata } from "next";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { SlokaPdfNotes } from "@/components/dashboard/notes/SlokaPdfNotes";
import { dashboardUser, prefsFor } from "@/lib/dashboard/state";

export const metadata: Metadata = { title: "Notes" };

export default async function Page() {
  const user = await dashboardUser("/dashboard/notes");
  const prefs = await prefsFor(user.id);
  return (
    <ModulePage moduleKey="notes">
      <SlokaPdfNotes defaultLanguage={prefs.meaningLang} />
    </ModulePage>
  );
}
