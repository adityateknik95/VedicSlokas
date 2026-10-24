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
  google_not_connected: "Your Google account isn't connected (or its access was removed). Connect it above, or paste your own link.",
  google_failed: "Google Calendar couldn't make the meeting just now. Try again, or paste your own link.",
};

const field = "mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink focus:border-gold";
const pad = (n: number) => String(n).padStart(2, "0");
/** ISO instant → the browser's local date and time, for the inputs. */
function localParts(iso: string) {
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
const localWhen = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** auto: the site makes (or keeps moving) a Google Meet link; own: a link typed in. */
type LinkMode = "auto" | "own";
type Draft = { id?: string; title: string; description: string; date: string; time: string; linkMode: LinkMode; autoMeet: boolean; meetingUrl: string; recordingUrl: string; teacherEmail: string };
const EMPTY: Draft = { title: "", description: "", date: "", time: "", linkMode: "auto", autoMeet: false, meetingUrl: "", recordingUrl: "", teacherEmail: "" };

export type GoogleState = { email: string | null; available: boolean };

function ClassForm({ initial, isAdmin, google, onDone }: { initial: Draft; isAdmin: boolean; google: GoogleState; onDone: () => void }) {
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
    const own = d.linkMode === "own";
    if (own && !isMeetingUrl(d.meetingUrl.trim())) return setError(ERRORS.invalid_meeting_url);
    setSaving(true);
    try {
      await meFetch("/api/teach/classes", {
        body: {
          ...(d.id ? { id: d.id } : {}),
          title: d.title,
          description: d.description || null,
          startsAt: start.toISOString(),
          meetingUrl: own ? d.meetingUrl.trim() : null,
          recordingUrl: d.recordingUrl.trim() || null,
          teacherEmail: isAdmin ? d.teacherEmail.trim() || null : null,
        },
      });
      toast(d.id ? "Class updated." : own ? "Class scheduled." : "Class scheduled, with a new Google Meet link.");
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
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-ink">Meeting link</legend>
        {(google.email || d.autoMeet) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(["auto", "own"] as const).map((m) => (
              <label
                key={m}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${d.linkMode === m ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-muted"}`}
              >
                <input type="radio" name={`${ids}-link`} value={m} checked={d.linkMode === m} onChange={() => setD({ ...d, linkMode: m })} className="accent-[var(--saffron)]" />
                {m === "auto" ? (d.autoMeet ? "Keep the Google Meet link" : "Make a Google Meet link for me") : "Paste my own link"}
              </label>
            ))}
          </div>
        )}
        {d.linkMode === "auto" && (google.email || d.autoMeet) ? (
          <p className="mt-2 text-sm text-ink-muted">
            {d.autoMeet
              ? "The Calendar event and its Meet link move with any change to the date or time."
              : `A one hour Google Calendar event with a Meet link is created on ${google.email} when you save.`}
          </p>
        ) : (
          <>
            <input
              type="url"
              required
              inputMode="url"
              aria-label="Zoom or Google Meet link"
              placeholder="https://meet.google.com/… or https://…zoom.us/j/…"
              value={d.meetingUrl}
              onChange={set("meetingUrl")}
              className={field}
            />
            {!google.email && !d.autoMeet && google.available && <p className="mt-2 text-xs text-ink-muted">Connect Google Meet above to have links made for you.</p>}
          </>
        )}
      </fieldset>
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
const NOTICES: Record<string, { tone: "ok" | "error"; text: string }> = {
  connected: { tone: "ok", text: "Google Meet is connected. New classes get their own meeting link automatically." },
  denied: { tone: "error", text: "Google access wasn't allowed, so nothing changed." },
  no_calendar: { tone: "error", text: "Google didn't grant Calendar access. Connect again and tick the Calendar permission." },
  not_configured: { tone: "error", text: "Google isn't set up on this site yet (the Google keys are missing)." },
  error: { tone: "error", text: "Connecting Google didn't work. Please try again." },
};

/** Connect (or disconnect) the Google account that owns the Meet links. */
function GoogleConnect({ google, notice }: { google: GoogleState; notice: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const message = notice ? NOTICES[notice] : undefined;

  const disconnect = async () => {
    if (!window.confirm("Disconnect Google? Classes already scheduled keep their Meet links; new ones will need a link pasted in.")) return;
    setBusy(true);
    try {
      await meFetch("/api/teach/google/disconnect", { body: {} });
      toast("Google disconnected.");
      router.replace("/dashboard/classes/manage");
      router.refresh();
    } catch (err) {
      toast(failureMessage(err, "disconnect Google"), { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="google-meet-title" className="dash-card space-y-3 p-5 sm:p-6">
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${message.tone === "ok" ? "border-[#6fbf8e]/50 text-[#9fdcb5]" : "border-[#e0796a]/50 text-[#f0a89c]"}`}>
          {message.text}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 id="google-meet-title" className="font-semibold text-ink">
            Google Meet links
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {google.email ? (
              <>
                Connected as <span className="text-ink">{google.email}</span>. Each new class gets a one hour Calendar event with its own Meet link.
              </>
            ) : (
              "Connect your Google account once, and every class you schedule gets its own Meet link automatically."
            )}
          </p>
        </div>
        {google.email ? (
          <button type="button" onClick={() => void disconnect()} disabled={busy} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-[#e0796a] disabled:opacity-60">
            Disconnect
          </button>
        ) : google.available ? (
          // A plain link: the browser goes to Google and comes back here.
          <a href="/api/teach/google/connect" className="inline-flex min-h-11 items-center rounded-full bg-saffron px-5 text-sm font-semibold text-on-saffron">
            Connect Google Meet
          </a>
        ) : (
          <span className="text-sm text-ink-muted">Google isn&apos;t set up on this site.</span>
        )}
      </div>
    </section>
  );
}

export function ManageClasses({ classes, isAdmin, google, notice }: { classes: ManagedClass[]; isAdmin: boolean; google: GoogleState; notice: string | null }) {
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
    setEditing({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      ...localParts(c.startsAt),
      linkMode: c.autoMeet ? "auto" : "own",
      autoMeet: c.autoMeet,
      meetingUrl: c.autoMeet ? "" : c.meetingUrl,
      recordingUrl: c.recordingUrl ?? "",
      teacherEmail: "",
    });

  return (
    <div className="space-y-6">
      <GoogleConnect google={google} notice={notice} />
      {editing ? (
        <ClassForm key={editing.id ?? "new"} initial={editing} isAdmin={isAdmin} google={google} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing({ ...EMPTY, linkMode: google.email ? "auto" : "own" })} className="min-h-12 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron">
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
