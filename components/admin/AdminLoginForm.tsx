"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  requireStaffSession,
  signInWithPassword,
  signOutSession,
} from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ProfileRole } from "@/lib/supabase/database.types";

type AuthState = "loading" | "guest" | "denied" | "authorized";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAuthState("guest");
      return;
    }
    const session = await requireStaffSession();
    if (session.ok) {
      setRole(session.profile.role);
      setAuthState("authorized");
      return;
    }
    if (session.reason === "forbidden") {
      setRole(session.role ?? "user");
      setAuthState("denied");
      return;
    }
    setAuthState("guest");
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (authState === "authorized") {
      router.replace("/admin/dashboard");
    }
  }, [authState, router]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setBusy(true);
    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      setBusy(false);
      setAuthError(result.message);
      return;
    }
    const session = await requireStaffSession();
    setBusy(false);
    if (!session.ok) {
      setRole(session.role ?? "user");
      setAuthState("denied");
      return;
    }
    setRole(session.profile.role);
    router.replace("/admin/dashboard");
  }

  async function handleLogout() {
    await signOutSession();
    setRole(null);
    setAuthState("guest");
  }

  if (authState === "loading" || authState === "authorized") {
    return (
      <div className="mx-auto max-w-lg px-4 py-28 text-center font-body text-slate-weathered">
        {authState === "authorized"
          ? "Opening dashboard…"
          : "Checking credentials…"}
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-center">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-charcoal to-transparent opacity-90"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-md px-4 py-16 sm:py-20">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-gold text-[10px] tracking-[0.28em] uppercase mb-3">
            Steward Access · RBAC
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-charcoal font-semibold mb-3">
            Administrative Login
          </h1>
          <div className="mx-auto sm:mx-0 h-px w-14 bg-gold mb-4" aria-hidden="true" />
          <p className="font-body text-sm sm:text-base text-slate-weathered leading-relaxed">
            Accounts with role{" "}
            <code className="font-mono text-xs text-crimson">admin</code> or{" "}
            <code className="font-mono text-xs text-crimson">developer</code>{" "}
            unlock{" "}
            <span className="font-mono text-xs text-crimson">/admin/dashboard</span>.
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <p className="mb-6 border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson">
            Supabase env vars are missing. Copy{" "}
            <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env.local</code>.
          </p>
        )}

        {callbackError && (
          <p
            className="mb-6 border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson"
            role="alert"
          >
            {callbackError}
          </p>
        )}

        {authState === "denied" && (
          <p className="mb-6 border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson">
            Signed in as{" "}
            <code className="font-mono">{role ?? "user"}</code>. Elevate to{" "}
            <code className="font-mono">admin</code> or{" "}
            <code className="font-mono">developer</code> in Supabase, then sign
            out and back in.
          </p>
        )}

        <form
          onSubmit={handleLogin}
          className="admin-panel space-y-4 rounded-sm p-6 sm:p-7"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs tracking-[0.12em] uppercase text-slate-weathered"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input focus-ring"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs tracking-[0.12em] uppercase text-slate-weathered"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m13.772 13.772L21 21m-3.228-3.228L21 21M9.88 9.88a3 3 0 004.24 4.24"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {authError && (
            <p className="text-sm text-crimson" role="alert">
              {authError}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured()}
            className="focus-ring btn-primary w-full px-5 py-3 text-base tracking-wide disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Enter Dashboard"}
          </button>
          {authState === "denied" && (
            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring w-full border border-charcoal/20 px-5 py-3 text-sm museum-ease hover:border-charcoal/40"
            >
              Sign out
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
