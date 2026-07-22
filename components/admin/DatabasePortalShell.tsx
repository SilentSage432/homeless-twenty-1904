"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requireStaffSession } from "@/lib/supabase/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  isDeveloperRole,
  type Profile,
} from "@/lib/supabase/database.types";
import { AdminSection } from "@/components/admin/AdminUi";
import { AdminNav } from "@/components/admin/AdminNav";
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
    eyebrow: "Browse · Records",
    title: "Table Explorer",
    description:
      "Browse plaques, events, and steward profiles. Prefer the Dashboard forms for photos, dates, and payment links — Quick Edit is for short text fixes.",
  },
  {
    key: "storage",
    label: "Storage Assets",
    eyebrow: "Photos · Uploads",
    title: "Storage Inspector",
    description:
      "Photos uploaded for plaques. Delete only if you’re sure nothing on the site still uses that photo.",
  },
  {
    key: "sql",
    label: "SQL Console",
    eyebrow: "Developer · Emergency",
    title: "SQL Console",
    description:
      "Run administrative queries. Only use this if you know exactly what the command does — changes often cannot be undone.",
    developerOnly: true,
  },
];

export function DatabasePortalShell() {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<TabKey>("tables");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    const session = await requireStaffSession();
    if (!session.ok) {
      if (session.reason === "unconfigured" || session.reason === "unauthenticated") {
        router.replace("/admin");
        return;
      }
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
        <p className="font-body text-slate-weathered">Checking your sign-in…</p>
      </div>
    );
  }

  if (gate === "denied") {
    return (
      <div className="mx-auto max-w-md px-4 py-28 text-center admin-panel p-8">
        <p className="font-display text-2xl text-charcoal mb-3">Access denied</p>
        <p className="font-body text-sm text-slate-weathered mb-8">
          Your account doesn&apos;t have permission to open this page. Ask a
          developer to grant Admin access.
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

  async function exportSnapshot() {
    setExporting(true);
    setExportError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setExportError("Supabase is not configured.");
      setExporting(false);
      return;
    }
    const tables = [
      "plaques",
      "site_settings",
      "site_content_sections",
      "faqs",
      "public_documents",
    ] as const;

    try {
      const snapshot: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        exported_by: profile?.full_name?.trim() || profile?.role || null,
        source: "homelesstwenty",
      };
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw new Error(`${table}: ${error.message}`);
        snapshot[table] = data ?? [];
      }

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = url;
      link.download = `homelesstwenty-snapshot-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
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
                Browse &amp; fix site data
              </p>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-parchment font-semibold leading-tight">
                Data browser
              </h1>
              <p className="mt-3 font-body text-sm text-parchment/70 max-w-xl">
                Look up plaques, events, and uploaded photos. Prefer the Dashboard
                forms for normal edits. Signed in as{" "}
                <span className="text-parchment">
                  {profile?.full_name?.trim() || role}
                </span>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3 self-start">
              <div>
                <button
                  type="button"
                  onClick={() => void exportSnapshot()}
                  disabled={exporting}
                  className="focus-ring btn-gold bg-transparent px-5 py-2.5 text-sm disabled:opacity-60"
                >
                  {exporting ? "Exporting…" : "Export Site Data Snapshot (JSON)"}
                </button>
                <p className="mt-1.5 max-w-[16rem] text-[10px] leading-relaxed text-parchment/55">
                  Downloads a backup file of plaques, settings, FAQs, and
                  documents. Does not change the live site.
                </p>
              </div>
              <Link
                href="/admin/dashboard"
                className="focus-ring btn-gold bg-transparent px-5 py-2.5 text-sm"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
          {exportError ? (
            <p className="mt-3 border border-crimson/40 bg-crimson/[0.08] px-4 py-2 text-sm text-crimson">
              {exportError}
            </p>
          ) : null}
        </header>

        <AdminNav />

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
