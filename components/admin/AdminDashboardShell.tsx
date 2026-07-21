"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireStaffSession, signOutSession } from "@/lib/supabase/auth";
import {
  isDeveloperRole,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase/database.types";
import { ManageEventsForm } from "@/components/admin/ManageEventsForm";
import { ManagePlaquesForm } from "@/components/admin/ManagePlaquesForm";
import { SystemOverridesPanel } from "@/components/admin/SystemOverridesPanel";
import { StewardManagementPanel } from "@/components/admin/StewardManagementPanel";

type Gate = "loading" | "denied" | "ready";

export function AdminDashboardShell() {
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

    setProfile(session.profile);
    setGate("ready");
  }, [router]);

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
        <p className="font-body text-slate-weathered">
          Verifying authenticated role…
        </p>
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
          cannot open the steward workspace. Elevate to{" "}
          <code className="font-mono">admin</code> or{" "}
          <code className="font-mono">developer</code> in Supabase.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="focus-ring btn-primary px-6 py-3 text-sm tracking-wide"
        >
          Return to login
        </button>
      </div>
    );
  }

  const role = profile?.role ?? null;
  const showDeveloperCockpit = isDeveloperRole(role);
  const showPersonnel = role === "admin" || role === "developer";
  const displayName = profile?.full_name?.trim() || profile?.role || "Steward";

  return (
    <div className="relative min-h-[80vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-charcoal via-charcoal-soft to-transparent opacity-[0.94]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Control deck header */}
        <header className="cockpit-header mb-8 sm:mb-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-gold text-[10px] sm:text-xs tracking-[0.28em] uppercase mb-3">
                Secure Steward Portal · RBAC
              </p>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-parchment font-semibold leading-tight">
                {showDeveloperCockpit
                  ? "Developer Cockpit"
                  : "Administrative Ledger"}
              </h1>
              <p className="mt-3 font-body text-sm sm:text-base leading-relaxed text-parchment/70 max-w-xl">
                Signed in as{" "}
                <span className="text-parchment">{displayName}</span>
                {" · "}
                <span className="font-mono text-gold text-sm">{role}</span>
                {showDeveloperCockpit
                  ? " — telemetry, personnel, and content tools online."
                  : " — content tools and personnel invites."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:flex-col lg:items-stretch lg:justify-between lg:min-w-[11rem]">
              <div className="cockpit-badge">
                <span className="cockpit-ring cockpit-ring--ok" aria-hidden="true" />
                <div>
                  <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-parchment/55">
                    Session
                  </p>
                  <p className="font-mono text-xs text-parchment tracking-wide">
                    LIVE · {role?.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="focus-ring btn-gold px-5 py-2.5 text-sm self-start sm:self-auto bg-transparent"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {showDeveloperCockpit && (
          <div className="mb-10 space-y-8">
            <SystemOverridesPanel />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <ManageEventsForm role={role} />
          <ManagePlaquesForm role={role} />
        </div>

        {showPersonnel && role && profile && (
          <div className="mt-8 sm:mt-10">
            <StewardManagementPanel
              actorRole={role}
              currentUserId={profile.id}
            />
          </div>
        )}

        <p className="mt-10 text-center font-mono text-[11px] tracking-wide text-slate-weathered">
          RLS · public read · admin/developer write · bucket{" "}
          <span className="text-crimson">plaque-assets</span>
        </p>
      </div>
    </div>
  );
}
