"use client";

import { useRef, useState } from "react";
import { broadcastAuth } from "@/lib/auth-channel";
import { failureMessage, MeError, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";
import { trapTab } from "../focus-trap";

const button = "inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** A fresh sign-in (reauth=1 shows the form to a signed-in visitor), then back to Settings. */
const REAUTH_URL = `/login?reauth=1&callbackUrl=${encodeURIComponent("/dashboard/settings")}`;

/** Download my data, sign out everywhere, delete my account. */
export function DataControls({ email }: { email: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await meFetch("/api/me/sign-out-all", { body: {} });
      broadcastAuth("signed-out");
      window.dispatchEvent(new Event("vs-auth-change"));
      window.location.assign("/login?signedOut=1");
    } catch (error) {
      toast(failureMessage(error, "sign out your devices"), { tone: "error" });
      setSigningOut(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await meFetch("/api/me/delete", { body: { confirm: "DELETE" } });
      try {
        localStorage.removeItem("vedicslokas:favorites-merged");
      } catch {
        // Nothing to clear.
      }
      broadcastAuth("signed-out");
      window.dispatchEvent(new Event("vs-auth-change"));
      window.location.assign("/?accountDeleted=1");
    } catch (error) {
      setDeleting(false);
      if (error instanceof MeError && error.code === "reauth_required") {
        setNeedsSignIn(true);
        return;
      }
      toast(failureMessage(error, "delete your account"), { tone: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">Download my data</p>
          <p className="text-xs text-ink-muted">Your profile, favourites, progress, preferences and interests, as one JSON file.</p>
        </div>
        <a href="/api/me/export" download className={`${button} border-line text-ink hover:border-gold`}>
          Download
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">Sign out of all devices</p>
          <p className="text-xs text-ink-muted">Ends every session, including this one. You can sign in again with your email link or Google.</p>
        </div>
        <button type="button" onClick={() => void signOutEverywhere()} disabled={signingOut} className={`${button} border-line text-ink hover:border-gold`}>
          {signingOut ? "Signing out…" : "Sign out everywhere"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e0796a]/40 p-4">
        <div>
          <p className="text-sm font-medium text-ink">Delete my account</p>
          <p className="text-xs text-ink-muted">Permanent and immediate. The library stays open to you without an account.</p>
        </div>
        <button
          ref={opener}
          type="button"
          onClick={() => {
            setConfirmText("");
            setNeedsSignIn(false);
            dialog.current?.showModal();
          }}
          className={`${button} border-[#e0796a]/60 text-ink hover:bg-[#e0796a]/15`}
        >
          Delete account…
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        aria-describedby="delete-desc"
        onClose={() => opener.current?.focus()}
        onKeyDown={trapTab}
        className="m-auto w-[min(94vw,32rem)] rounded-[1.5rem] border border-[#e0796a]/50 bg-bg-2 p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <form onSubmit={(e) => void deleteAccount(e)} className="p-6 sm:p-8">
          <h2 id="delete-title" className="display text-3xl text-ink">
            Delete your account?
          </h2>
          <div id="delete-desc" className="mt-3 space-y-3 text-sm text-ink-muted">
            <p>This removes, right away and for good:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>your profile and sign-in methods ({email})</li>
              <li>your favourites, progress, learned slokas and streak</li>
              <li>your preferences and &ldquo;Notify me&rdquo; choices</li>
              <li>every signed-in session, on every device</li>
            </ul>
            <p>Security records keep only that an account was deleted, with nothing that identifies you. We will email a confirmation.</p>
          </div>
          <label htmlFor="delete-confirm" className="mt-6 block text-sm font-medium text-ink">
            Type DELETE to confirm
          </label>
          <input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-4 tracking-[0.2em] text-ink focus:border-[#e0796a]"
          />
          {needsSignIn && (
            <p role="alert" className="mt-4 rounded-xl border border-[#e0796a]/50 p-3 text-sm text-ink">
              To keep your account safe, deleting it needs a sign-in from the last hour.{" "}
              <a href={REAUTH_URL} className="font-semibold text-accent underline underline-offset-4">
                Sign in again
              </a>
              , then come back here.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className={`${button} border-line text-ink hover:border-gold`}>
              Keep my account
            </button>
            <button type="submit" disabled={confirmText !== "DELETE" || deleting} className={`${button} border-[#c0503f] bg-[#c0503f] text-white`}>
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
