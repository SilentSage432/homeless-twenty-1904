"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getSessionUserId,
  updateUserPassword,
} from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Phase = "checking" | "ready" | "no-session" | "success";

const REDIRECT_DELAY_MS = 1600;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setPhase("no-session");
      return;
    }
    const userId = await getSessionUserId();
    setPhase(userId ? "ready" : "no-session");
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    if (phase !== "success") return;
    const timer = setTimeout(() => {
      router.replace("/admin");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const result = await updateUserPassword(password);
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPassword("");
    setConfirm("");
    setPhase("success");
  }

  return (
    <div className="relative min-h-[80vh] flex items-center">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-charcoal to-transparent opacity-90"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-md px-4 py-16 sm:py-20">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-gold text-[10px] tracking-[0.28em] uppercase mb-3 font-mono">
            Steward Access · RBAC
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-charcoal font-semibold mb-3">
            Set Your Password
          </h1>
          <div className="mx-auto sm:mx-0 h-px w-14 bg-gold mb-4" aria-hidden="true" />
          <p className="font-body text-sm sm:text-base text-slate-weathered leading-relaxed">
            Choose a password to finish activating your steward account.
          </p>
        </div>

        {phase === "success" && (
          <div
            className="mb-6 border border-gold/40 bg-parchment-deep/80 px-4 py-4 text-sm text-charcoal"
            role="status"
            aria-live="polite"
          >
            <p className="font-display text-lg text-charcoal mb-1">
              Password saved.
            </p>
            <p className="text-slate-weathered">
              Your credentials are active. Redirecting to the login portal…
            </p>
          </div>
        )}

        {phase === "no-session" && (
          <p
            className="mb-6 border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson"
            role="alert"
          >
            No active invite session found. Open your invite link again, or{" "}
            <a href="/admin" className="underline underline-offset-4">
              return to login
            </a>
            .
          </p>
        )}

        {phase === "ready" && (
          <form
            onSubmit={handleSubmit}
            className="admin-panel space-y-4 rounded-sm p-6 sm:p-7"
          >
            <div>
              <label htmlFor="new-password" className="admin-label">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input focus-ring pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="focus-ring absolute inset-y-0 right-0 flex items-center px-3 text-slate-weathered museum-ease hover:text-charcoal"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="admin-label">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="admin-input focus-ring"
              />
            </div>

            {error && (
              <p className="text-sm text-crimson" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="focus-ring btn-primary w-full px-5 py-3 text-base tracking-wide disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save password & continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
