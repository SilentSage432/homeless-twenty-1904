"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requireStaffSession, signOutSession } from "@/lib/supabase/auth";
import {
  isDeveloperRole,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase/database.types";
import { AdminNav } from "@/components/admin/AdminNav";

type Gate = "loading" | "denied" | "ready";

/**
 * Shared client gate + chrome for admin sub-pages.
 * Verifies an admin/developer session, then renders the nav, a header, and
 * the page body. Pass `requireDeveloper` for developer-only surfaces.
 */
export function AdminPageShell({
  eyebrow,
  title,
  description,
  requireDeveloper = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  requireDeveloper?: boolean;
  children: ReactNode | ((profile: Profile) => ReactNode);
}) {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deniedRole, setDeniedRole] = useState<ProfileRole | null>(null);

  const verify = useCallback(async () => {
    const session = await requireStaffSession();
    if (!session.ok) {
      if (session.reason === "unconfigured" || session.reason === "unauthenticated") {
        router.replace("/admin");
        return;
      }
      setDeniedRole(session.role ?? "user");
      setGate("denied");
      return;
    }
    if (requireDeveloper && !isDeveloperRole(session.profile.role)) {
      setDeniedRole(session.profile.role);
      setGate("denied");
      return;
    }
    setProfile(session.profile);
    setGate("ready");
  }, [router, requireDeveloper]);

  useEffect(() => {
    void verify();
  }, [verify]);

  async function handleLogout() {
    await signOutSession();
    router.replace("/admin");
  }

  if (gate === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-28 text-center">
        <p className="text-gold text-xs tracking-[0.28em] uppercase mb-3 font-mono">
          Session checkpoint
        </p>
        <p className="font-body text-slate-weathered">Verifying clearance…</p>
      </div>
    );
  }

  if (gate === "denied") {
    return (
      <div className="mx-auto max-w-md px-4 py-28 text-center admin-panel p-8">
        <p className="font-display text-2xl text-charcoal mb-3">Access denied</p>
        <p className="font-body text-sm text-slate-weathered mb-8">
          Role{" "}
          <code className="font-mono text-crimson">{deniedRole ?? "user"}</code>{" "}
          cannot open this workspace.
          {requireDeveloper ? " Developer clearance required." : ""}
        </p>
        <Link
          href="/admin"
          className="focus-ring btn-primary inline-block px-6 py-3 text-sm tracking-wide"
        >
          Return to login
        </Link>
      </div>
    );
  }

  const role = profile?.role ?? null;
  const displayName = profile?.full_name?.trim() || role || "Steward";

  return (
    <div className="relative min-h-[80vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-charcoal via-charcoal-soft to-transparent opacity-[0.94]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-gold text-[10px] sm:text-xs tracking-[0.28em] uppercase mb-3">
              {eyebrow}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-parchment font-semibold leading-tight">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 font-body text-sm text-parchment/70 max-w-xl">
                {description}
              </p>
            ) : null}
            <p className="mt-2 font-body text-xs text-parchment/55">
              <span className="text-parchment">{displayName}</span> ·{" "}
              <span className="font-mono text-gold">{role}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="focus-ring btn-gold shrink-0 self-start bg-transparent px-5 py-2.5 text-sm"
          >
            Sign out
          </button>
        </header>

        <AdminNav />

        {profile
          ? typeof children === "function"
            ? children(profile)
            : children
          : null}
      </div>
    </div>
  );
}
