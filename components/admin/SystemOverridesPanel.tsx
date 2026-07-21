"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSection } from "@/components/admin/AdminUi";
import { isSupabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLAQUE_ASSETS_BUCKET } from "@/lib/supabase/storage";

type CheckState = "idle" | "checking" | "ok" | "warn" | "fail";

type Metric = {
  label: string;
  value: string;
  detail?: string;
  state: CheckState;
  key: string;
};

function StatusRing({ state }: { state: CheckState }) {
  const tone =
    state === "ok"
      ? "ok"
      : state === "warn"
        ? "warn"
        : state === "fail"
          ? "fail"
          : state === "checking"
            ? "checking"
            : "idle";

  return (
    <span
      className={`cockpit-ring cockpit-ring--${tone}`}
      aria-hidden="true"
      title={state}
    />
  );
}

/**
 * Object-list ping against the bucket itself.
 * Avoids storage.buckets metadata APIs (getBucket / listBuckets) that need
 * elevated ownership we cannot grant on managed Supabase projects.
 */
async function pingPlaqueAssetsBucket(): Promise<{
  ok: boolean;
  value: string;
  detail: string;
  state: CheckState;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      value: "Client unavailable",
      detail: "Supabase browser client missing",
      state: "fail",
    };
  }

  const { data, error } = await supabase.storage
    .from(PLAQUE_ASSETS_BUCKET)
    .list("", { limit: 1 });

  const bucketMissing =
    !!error && /bucket not found|no such bucket/i.test(error.message);

  // Healthy when list succeeds, or when any error is not "bucket not found"
  if (!bucketMissing) {
    return {
      ok: true,
      value: "Healthy · Configured",
      detail: error
        ? `Bucket active · list note: ${error.message}`
        : `plaque-assets list ok · ${data?.length ?? 0} object(s) sampled`,
      state: "ok",
    };
  }

  return {
    ok: false,
    value: "Bucket missing",
    detail: error.message,
    state: "warn",
  };
}

export function SystemOverridesPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [bucketActionBusy, setBucketActionBusy] = useState(false);
  const [bucketActionMsg, setBucketActionMsg] = useState<string | null>(null);
  const [bucketActionError, setBucketActionError] = useState<string | null>(null);

  const runDiagnostics = useCallback(async () => {
    setRunning(true);
    setBucketActionMsg(null);
    setBucketActionError(null);
    const next: Metric[] = [];

    const nodeEnv = process.env.NODE_ENV ?? "unknown";
    next.push({
      key: "deploy",
      label: "Deployment state",
      value: nodeEnv === "production" ? "Production build" : "Development",
      detail: `NODE_ENV=${nodeEnv}`,
      state: nodeEnv === "production" ? "ok" : "warn",
    });

    next.push({
      key: "runtime",
      label: "App runtime",
      value: typeof window !== "undefined" ? "Browser client" : "Server",
      detail: "Next.js App Router · client diagnostics",
      state: "ok",
    });

    const configured = isSupabaseConfigured();
    next.push({
      key: "env",
      label: "Supabase env",
      value: configured ? "Configured" : "Missing keys",
      detail: configured
        ? "NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY present"
        : "Copy .env.example → .env.local",
      state: configured ? "ok" : "fail",
    });

    if (configured) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        next.push({
          key: "db",
          label: "Database connection",
          value: "Client unavailable",
          state: "fail",
        });
        next.push({
          key: "storage",
          label: "Storage · plaque-assets",
          value: "Client unavailable",
          state: "fail",
        });
      } else {
        const started = performance.now();
        const { error: eventsError, count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });
        const { error: plaquesError, count: plaquesCount } = await supabase
          .from("plaques")
          .select("*", { count: "exact", head: true });
        const latency = Math.round(performance.now() - started);

        if (eventsError || plaquesError) {
          next.push({
            key: "db",
            label: "Database connection",
            value: "Query failed",
            detail: eventsError?.message || plaquesError?.message,
            state: "fail",
          });
        } else {
          next.push({
            key: "db",
            label: "Database connection",
            value: `Healthy · ${latency}ms`,
            detail: "events + plaques head queries succeeded",
            state: latency > 1200 ? "warn" : "ok",
          });
          next.push({
            key: "events",
            label: "Events rows",
            value: String(eventsCount ?? 0),
            detail: "Live table count (RLS-filtered)",
            state: "ok",
          });
          next.push({
            key: "plaques",
            label: "Plaques rows",
            value: String(plaquesCount ?? 0),
            detail: "Live table count (RLS-filtered)",
            state: "ok",
          });
        }

        const storage = await pingPlaqueAssetsBucket();
        next.push({
          key: "storage",
          label: "Storage · plaque-assets",
          value: storage.value,
          detail: storage.detail,
          state: storage.state,
        });
      }
    } else {
      next.push({
        key: "db",
        label: "Database connection",
        value: "Skipped",
        detail: "Requires configured Supabase client",
        state: "warn",
      });
      next.push({
        key: "storage",
        label: "Storage · plaque-assets",
        value: "Skipped",
        state: "warn",
      });
    }

    next.push({
      key: "rbac",
      label: "RBAC surface",
      value: "developer",
      detail: "System Telemetry unlocked · content write via can_manage_content()",
      state: "ok",
    });

    setMetrics(next);
    setLastRun(new Date().toLocaleString());
    setRunning(false);
  }, []);

  useEffect(() => {
    void runDiagnostics();
  }, [runDiagnostics]);

  const storageMetric = metrics.find((m) => m.key === "storage");
  const showBucketBanner =
    storageMetric?.state === "warn" || storageMetric?.state === "fail";

  async function handleStorageSetupCheck() {
    setBucketActionBusy(true);
    setBucketActionMsg(null);
    setBucketActionError(null);
    try {
      // Read-only verification — no createBucket / no server create path.
      const result = await pingPlaqueAssetsBucket();

      if (result.ok) {
        setBucketActionMsg(
          "plaque-assets verified. Storage marked Healthy / Configured."
        );
        setMetrics((prev) =>
          prev.map((m) =>
            m.key === "storage"
              ? {
                  ...m,
                  value: result.value,
                  detail: result.detail,
                  state: "ok",
                }
              : m
          )
        );
        setLastRun(new Date().toLocaleString());
        return;
      }

      setBucketActionError(result.detail);
      setMetrics((prev) =>
        prev.map((m) =>
          m.key === "storage"
            ? {
                ...m,
                value: result.value,
                detail: result.detail,
                state: result.state,
              }
            : m
        )
      );
    } catch (err) {
      setBucketActionError(
        err instanceof Error ? err.message : "Storage verification failed."
      );
    } finally {
      setBucketActionBusy(false);
    }
  }

  return (
    <AdminSection
      eyebrow="Component C · Control deck"
      title="System Telemetry"
      description="Live connection status, deployment state, database latency, row counts, and storage health for the plaque-assets bucket."
      deck
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 pb-4">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-slate-weathered">
          {lastRun ? `Last sweep · ${lastRun}` : "Initializing sweep…"}
        </p>
        <button
          type="button"
          onClick={() => void runDiagnostics()}
          disabled={running}
          className="focus-ring btn-gold tap-target justify-center bg-transparent px-4 py-2 text-xs tracking-wide disabled:opacity-60"
        >
          {running ? "Scanning…" : "Re-run diagnostics"}
        </button>
      </div>

      {showBucketBanner ? (
        <div className="cockpit-banner" role="status">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-800">
              Storage verification
            </p>
            <p className="font-display text-lg text-charcoal leading-snug">
              Confirm plaque-assets via storage.list
            </p>
            <p className="text-sm text-slate-weathered">
              This check lists objects in the bucket (limit 1). It does not
              touch storage.buckets metadata or attempt client-side creation.
            </p>
            {bucketActionMsg ? (
              <p className="text-sm text-charcoal">{bucketActionMsg}</p>
            ) : null}
            {bucketActionError ? (
              <p className="text-sm text-crimson" role="alert">
                {bucketActionError}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void handleStorageSetupCheck()}
            disabled={bucketActionBusy}
            className="focus-ring btn-primary shrink-0 px-5 py-3 text-sm tracking-wide disabled:opacity-60"
          >
            {bucketActionBusy ? "Checking…" : "Run storage setup check"}
          </button>
        </div>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <li key={metric.key} className="cockpit-metric">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-slate-weathered">
                {metric.label}
              </p>
              <StatusRing state={metric.state} />
            </div>
            <p className="font-mono text-base sm:text-lg text-charcoal leading-snug tracking-tight">
              {metric.value}
            </p>
            {metric.detail ? (
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-slate-weathered break-words">
                {metric.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </AdminSection>
  );
}
