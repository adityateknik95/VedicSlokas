"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { failureMessage, meFetch, MeError } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";

/** Display name, the only editable part of the profile. */
export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return setError("Please enter a name.");
    if (trimmed.length > 80) return setError("Keep it under 80 characters.");
    setError("");
    setSaving(true);
    try {
      await meFetch("/api/me/profile", { method: "PATCH", body: { name: trimmed } });
      toast("Name saved.");
      router.refresh();
    } catch (err) {
      if (err instanceof MeError && err.code === "invalid") setError("Please use letters, spaces and simple punctuation.");
      else toast(failureMessage(err, "save your name"), { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} noValidate className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-64">
        <label htmlFor="display-name" className="mb-1.5 block text-sm font-medium text-ink">
          Display name
        </label>
        <input
          id="display-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          autoComplete="name"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "display-name-error" : undefined}
          className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink focus:border-gold aria-[invalid=true]:border-[#e0796a]"
        />
        {error && (
          <p id="display-name-error" className="mt-1.5 text-sm text-[#f0a090]">
            {error}
          </p>
        )}
      </div>
      <button type="submit" disabled={saving || value.trim() === name} className="inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
