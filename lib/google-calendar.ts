import "server-only";
import { env, siteOrigin } from "@/lib/env";

/**
 * The few Google calls we need: OAuth consent for Calendar, and creating, updating and
 * deleting a Calendar event that carries a Google Meet link. Uses the same OAuth client as
 * "Sign in with Google" (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). `fetch` is injectable so
 * tests never reach Google.
 */

export type Fetch = typeof fetch;

/** calendar.events: create and change events (and their Meet links) on the teacher's calendar. */
export const CALENDAR_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];
export const callbackUrl = () => `${siteOrigin()}/api/teach/google/callback`;

export class GoogleError extends Error {
  constructor(
    readonly code: "not_configured" | "revoked" | "no_scope" | "failed",
    message: string,
  ) {
    super(message);
  }
}

function client() {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = env();
  if (!id || !secret) throw new GoogleError("not_configured", "Google sign-in keys are not set");
  return { id, secret };
}

export function consentUrl(state: string, loginHint?: string): string {
  const params = new URLSearchParams({
    client_id: client().id,
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: CALENDAR_SCOPES.join(" "),
    access_type: "offline",
    // Always ask, so Google returns a refresh token even on a second connection.
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>, f: Fetch) {
  const { id, secret } = client();
  const res = await f("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, ...body }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; scope?: string; id_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    if (data.error === "invalid_grant") throw new GoogleError("revoked", "Google access was revoked or expired");
    throw new GoogleError("failed", `Google token request failed (${res.status} ${data.error ?? ""})`);
  }
  return data;
}

/** Exchanges the consent code for tokens and finds out which Google account granted them. */
export async function exchangeCode(code: string, f: Fetch = fetch): Promise<{ refreshToken: string; email: string }> {
  const data = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: callbackUrl() }, f);
  if (!data.refresh_token) throw new GoogleError("failed", "Google did not return a refresh token");
  if (!data.scope?.split(" ").includes("https://www.googleapis.com/auth/calendar.events")) {
    throw new GoogleError("no_scope", "Calendar access was not granted");
  }
  const who = await f("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${data.access_token}` }, cache: "no-store" });
  const info = (await who.json().catch(() => ({}))) as { email?: string };
  if (!who.ok || !info.email) throw new GoogleError("failed", "Could not read the Google account's email");
  return { refreshToken: data.refresh_token, email: info.email };
}

export async function accessToken(refreshToken: string, f: Fetch = fetch): Promise<string> {
  const data = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" }, f);
  return data.access_token as string;
}

/** Best effort: tells Google to forget the grant. */
export async function revoke(refreshToken: string, f: Fetch = fetch): Promise<void> {
  await f("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken }),
  }).catch(() => undefined);
}

export type EventInput = { title: string; description?: string | null; start: Date; end: Date; guests?: string[] };

const EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function eventBody(input: EventInput) {
  return {
    summary: input.title,
    description: [input.description, `Join from your VedicSlokas dashboard: ${siteOrigin()}/dashboard/classes`].filter(Boolean).join("\n\n"),
    start: { dateTime: input.start.toISOString() },
    end: { dateTime: input.end.toISOString() },
    attendees: input.guests?.map((email) => ({ email })),
    // Students join through the site, not from the calendar.
    guestsCanSeeOtherGuests: false,
    reminders: { useDefault: true },
  };
}

async function calendarCall(token: string, url: string, init: RequestInit, f: Fetch) {
  const res = await f(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers }, cache: "no-store" });
  if (res.status === 401) throw new GoogleError("revoked", "Google access was revoked");
  return res;
}

/** Creates the event with a new Google Meet link. requestId makes a retry return the same meeting. */
export async function createMeetEvent(token: string, requestId: string, input: EventInput, f: Fetch = fetch): Promise<{ eventId: string; meetUrl: string }> {
  const res = await calendarCall(
    token,
    `${EVENTS}?conferenceDataVersion=1&sendUpdates=none`,
    { method: "POST", body: JSON.stringify({ ...eventBody(input), conferenceData: { createRequest: { requestId, conferenceSolutionKey: { type: "hangoutsMeet" } } } }) },
    f,
  );
  const data = (await res.json().catch(() => ({}))) as { id?: string; hangoutLink?: string; conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] } };
  const meetUrl = data.hangoutLink ?? data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
  if (!res.ok || !data.id || !meetUrl) throw new GoogleError("failed", `Google Calendar could not create the meeting (${res.status})`);
  return { eventId: data.id, meetUrl };
}

export async function updateEvent(token: string, eventId: string, input: EventInput, f: Fetch = fetch): Promise<void> {
  const res = await calendarCall(token, `${EVENTS}/${encodeURIComponent(eventId)}?sendUpdates=none`, { method: "PATCH", body: JSON.stringify(eventBody(input)) }, f);
  if (!res.ok) throw new GoogleError("failed", `Google Calendar could not update the meeting (${res.status})`);
}

/** Deleting an event that is already gone counts as done. */
export async function deleteEvent(token: string, eventId: string, f: Fetch = fetch): Promise<void> {
  const res = await calendarCall(token, `${EVENTS}/${encodeURIComponent(eventId)}?sendUpdates=none`, { method: "DELETE" }, f);
  if (!res.ok && res.status !== 404 && res.status !== 410) throw new GoogleError("failed", `Google Calendar could not delete the meeting (${res.status})`);
}
