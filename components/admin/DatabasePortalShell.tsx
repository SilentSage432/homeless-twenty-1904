"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requireStaffSession } from "@/lib/supabase/auth";
import {
  isDeveloperRole,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase/database.types";
import { AdminSection } from "@/components/admin/AdminUi";
import { TableExplorer } from "@/components/admin/TableExplorer";
import { StorageInspector } from "@/components/admin/StorageInspector";
import { SqlConsole } from "@/components/admin/SqlConsole";

type Gate = "loading" | "denied" | "ready";
type TabKey = "tables" | "storage" | "sql";

type Tab = {
  key: TabKey;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  developerOnly?: boolean;
};

const TABS: Tab[] = [
  {
    key: "tables",
    label: "Tables",
    eyebrow: "Schema · Records",
    title: "Table Explorer",
    description:
      "Browse and maintain plaques, events, and profiles. Paginated stacked cards with quick edit and delete, bound by Row Level Security.",
  },
  {
    key: "storage",
    label: "Storage Assets",
    eyebrow: "Storage · plaque-assets",
    title: "Storage Inspector",
    description:
      "Inspect objects in the plaque-assets bucket. Preview thumbnails, review file size, and remove orphaned assets.",
  },
  {
    key: "sql",
    label: "SQL Console",
    eyebrow: "Developer · Emergency",
    title: "SQL Console",
    description:
      "Run administrative queries and schema refreshes through the developer-gated service-role executor.",
    developerOnly: true,
  },
];

export function DatabasePortalShell() {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deniedRole, setDeniedRole] = useState<ProfileRole | null>(null);
  const [tab, setTab] = useState<TabKey>("tables");

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

  const role = profile?.role ?? null;
  const isDeveloper = isDeveloperRole(role);

  const visibleTabs = useMemo(
    () => TABS.filter((t) => !t.developerOnly || isDeveloper),
    [isDeveloper]
  );

  // If a non-developer somehow lands on the SQL tab, fall back to tables.
  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) {
      setTab("tables");
    }
  }, [visibleTabs, tab]);

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
          cannot open the database portal. Elevate to{" "}
          <code className="font-mono">admin</code> or{" "}
          <code className="font-mono">developer</code>.
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

  const active = visibleTabs.find((t) => t.key === tab) ?? visibleTabs[0];

  return (
    <div className="relative min-h-[80vh]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-charcoal via-charcoal-soft to-transparent opacity-[0.94]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="cockpit-header mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-gold text-[10px] sm:text-xs tracking-[0.28em] uppercase mb-3">
                Database &amp; Schema Portal · RBAC
              </p>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-parchment font-semibold leading-tight">
                Data Control Room
              </h1>
              <p className="mt-3 font-body text-sm text-parchment/70 max-w-xl">
                Signed in as{" "}
                <span className="text-parchment">
                  {profile?.full_name?.trim() || role}
                </span>{" "}
                · <span className="font-mono text-gold">{role}</span>
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="focus-ring btn-gold shrink-0 self-start bg-transparent px-5 py-2.5 text-sm"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {/* Mobile: dropdown navigation */}
        <div className="mb-6 sm:hidden">
          <label className="admin-label" htmlFor="portal-tab">
            Section
          </label>
          <select
            id="portal-tab"
            value={tab}
            onChange={(e) => setTab(e.target.value as TabKey)}
            className="admin-input focus-ring"
          >
            {visibleTabs.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tablet+ : segmented tab bar */}
        <div className="mb-6 hidden flex-wrap gap-2 sm:flex">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                t.key === tab
                  ? "focus-ring border border-charcoal bg-charcoal px-4 py-2.5 text-sm text-parchment"
                  : "focus-ring border border-parchment/40 bg-parchment/70 px-4 py-2.5 text-sm text-charcoal museum-ease hover:border-charcoal/40"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {active ? (
          <AdminSection
            eyebrow={active.eyebrow}
            title={active.title}
            description={active.description}
            deck
          >
            {active.key === "tables" ? <TableExplorer /> : null}
            {active.key === "storage" ? <StorageInspector /> : null}
            {active.key === "sql" ? <SqlConsole /> : null}
          </AdminSection>
        ) : null}
      </div>
    </div>
  );
}
