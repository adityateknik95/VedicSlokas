"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { ManagedClass } from "@/lib/classes";
import { classEnd, isMeetingUrl } from "@/lib/classes-time";
import { MeError, failureMessage, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";

const ERRORS: Record<string, string> = {
  invalid_meeting_url: "Use a Google Meet or Zoom link starting with https://.",
  invalid_recording_url: "The recording link must start with https://.",
  unknown_teacher: "No teacher account has that email. Make them a teacher first.",
  forbidden: "You can only change your own classes.",
  not_found: "That class no longer exists.",
};

const field = "mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink focus:border-gold";
const pad = (n: number) => String(n).padStart(2, "0");
/** ISO instant → the browser's local date and time, for the inputs. */
function localParts(iso: string) {
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
const localWhen = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

type Draft = { id?: string; title: string; description: string; date: string; time: string; meetingUrl: string; recordingUrl: string; teacherEmail: string };
const EMPTY: Draft = { title: "", description: "", date: "", time: "", meetingUrl: "", recordingUrl: "", teacherEmail: "" };

function ClassForm({ initial, isAdmin, onDone }: { initial: Draft; isAdmin: boolean; onDone: () => void }) {
  const router = useRouter();
  const ids = useId();
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const start = new Date(`${d.date}T${d.time}`);
    if (Number.isNaN(start.getTime())) return setError("Choose a date and a start time.");
    if (!isMeetingUrl(d.meetingUrl.trim())) return setError(ERRORS.invalid_meeting_url);
    setSaving(true);
    try {
      await meFetch("/api/teach/classes", {
        body: {
          ...(d.id ? { id: d.id } : {}),
          title: d.title,
          description: d.description || null,
          startsAt: start.toISOString(),
          meetingUrl: d.meetingUrl.trim(),
          recordingUrl: d.recordingUrl.trim() || null,
          teacherEmail: isAdmin ? d.teacherEmail.trim() || null : null,
        },
      });
      toast(d.id ? "Class updated." : "Class scheduled.");
      onDone();
      router.refresh();
    } catch (err) {
      setError(err instanceof MeError && ERRORS[err.code] ? ERRORS[err.code] : failureMessage(err, "save the class"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="dash-card grid gap-4 p-5 sm:grid-cols-2 sm:p-7" aria-labelledby={`${ids}-title`}>
      <h2 id={`${ids}-title`} className="display text-2xl text-ink sm:col-span-2">
        {d.id ? "Edit class" : "New class"}
      </h2>
      <label className="text-sm font-medium text-ink sm:col-span-2">
        Title
        <input required minLength={2} maxLength={120} value={d.title} onChange={set("title")} className={field} />
      </label>
      <label className="text-sm font-medium text-ink">
        Date
        <input type="date" required value={d.date} onChange={set("date")} className={field} />
      </label>
      <label className="text-sm font-medium text-ink">
        Start time <span className="font-normal text-ink-muted">(your time zone; one hour long)</span>
        <input type="time" required value={d.time} onChange={set("time")} className={field} />
      </label>
      <label className="text-sm font-medium text-ink sm:col-span-2">
        Zoom or Google Meet link
        <input type="url" required inputMode="url" placeholder="https://meet.google.com/…" value={d.meetingUrl} onChange={set("meetingUrl")} className={field} />
      </label>
      <label className="text-sm font-medium text-ink sm:col-span-2">
        What the class covers <span className="font-normal text-ink-muted">(optional)</span>
        <textarea maxLength={1000} rows={3} value={d.description} onChange={set("description")} className={`${field} h-auto py-3`} />
      </label>
      <label className="text-sm font-medium text-ink">
        Recording link <span className="font-normal text-ink-muted">(after the class)</span>
        <input type="url" inputMode="url" placeholder="https://…" value={d.recordingUrl} onChange={set("recordingUrl")} className={field} />
      </label>
      {isAdmin && (
        <label className="text-sm font-medium text-ink">
          Teacher&apos;s email <span className="font-normal text-ink-muted">(blank: you)</span>
          <input type="email" value={d.teacherEmail} onChange={set("teacherEmail")} className={field} />
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#f0a89c] sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="min-h-12 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron disabled:opacity-60">
          {saving ? "Saving…" : d.id ? "Save changes" : "Schedule class"}
        </button>
        <button type="button" onClick={onDone} className="min-h-12 rounded-full border border-line px-6 text-sm font-semibold text-ink hover:border-gold">
          Close
        </button>
      </div>
    </form>
  );
}

/** The teacher's (or, for admins, everyone's) classes, with join counts, edit and cancel. */
export function ManageClasses({ classes, isAdmin }: { classes: ManagedClass[]; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [now] = useState(() => Date.now());

  const cancel = async (c: ManagedClass) => {
    if (!window.confirm(`Cancel "${c.title}" on ${localWhen(c.startsAt)}? Students will see it as cancelled.`)) return;
    try {
      await meFetch("/api/teach/classes/cancel", { body: { id: c.id } });
      toast("Class cancelled.");
      router.refresh();
    } catch (err) {
      toast(err instanceof MeError && ERRORS[err.code] ? ERRORS[err.code] : failureMessage(err, "cancel the class"), { tone: "error" });
    }
  };

  const edit = (c: ManagedClass) =>
    setEditing({ id: c.id, title: c.title, description: c.description ?? "", ...localParts(c.startsAt), meetingUrl: c.meetingUrl, recordingUrl: c.recordingUrl ?? "", teacherEmail: "" });

  return (
    <div className="space-y-6">
      {editing ? (
        <ClassForm key={editing.id ?? "new"} initial={editing} isAdmin={isAdmin} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing(EMPTY)} className="min-h-12 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron">
          + New class
        </button>
      )}

      {classes.length === 0 ? (
        <p className="dash-card p-6 text-sm text-ink-muted">No classes yet. Schedule the first one above.</p>
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => {
            const over = classEnd(c.startsAt, c.durationMin) <= now;
            return (
              <li key={c.id} className={`dash-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center ${c.cancelled || over ? "opacity-70" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-flame">
                    {localWhen(c.startsAt)} · {c.teacherName}
                    {c.cancelled && " · Cancelled"}
                    {!c.cancelled && over && " · Finished"}
                  </p>
                  <p className="mt-1 font-semibold text-ink">{c.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">{c.meetingUrl}</p>
                </div>
                <p className="shrink-0 text-sm text-ink-muted">{c.joined === 1 ? "1 joined" : `${c.joined} joined`}</p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => edit(c)} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink hover:border-gold">
                    Edit
                  </button>
                  {!c.cancelled && !over && (
                    <button type="button" onClick={() => void cancel(c)} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink hover:border-[#e0796a]">
                      Cancel class
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
