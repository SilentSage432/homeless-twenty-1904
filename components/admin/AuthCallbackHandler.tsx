"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Phase = "working" | "error";

/**
 * Finalizes an email-link sign-in (invite, recovery, magic link, confirmation).
 *
 * The app persists sessions in localStorage via the browser client, so the
 * code→session exchange must happen here (not in a server cookie route) for
 * the admin gate to recognize the session.
 */
export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState<string>("Finalizing sign-in…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    function fail(reason: string) {
      const target = `/admin?error=${encodeURIComponent(reason)}`;
      setPhase("error");
      setMessage(reason);
      router.replace(target);
    }

    async function finalize() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        fail("Supabase is not configured. Contact a developer.");
        return;
      }

      // Surface provider errors passed back in the URL (query or hash).
      const hashParams = new URLSearchParams(
        typeof window !== "undefined"
          ? window.location.hash.replace(/^#/, "")
          : ""
      );
      const providerError =
        searchParams.get("error_description") ??
        searchParams.get("error") ??
        hashParams.get("error_description") ??
        hashParams.get("error");
      if (providerError) {
        fail(providerError);
        return;
      }

      const code = searchParams.get("code");
      const type =
        searchParams.get("type") ?? hashParams.get("type") ?? null;
      const isInviteLike = type === "invite" || type === "recovery";

      // PKCE flow: exchange the ?code= for a session written to localStorage.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          fail("Your sign-in link is invalid or has expired. Request a new one.");
          return;
        }
      } else {
        // Implicit/hash flow: detectSessionInUrl handles token parsing.
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          fail("Sign-in link is missing or expired. Request a new invite.");
          return;
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        fail("Could not establish a session. Please sign in.");
        return;
      }

      // Invite/recovery links finish at the password setup page.
      router.replace(isInviteLike ? "/admin/update-password" : "/admin");
    }

    void finalize();
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <p className="text-gold text-xs tracking-[0.28em] uppercase mb-3 font-mono">
        Steward Access · RBAC
      </p>
      <p className="font-body text-slate-weathered">
        {phase === "error" ? message : "Finalizing sign-in…"}
      </p>
    </div>
  );
}
