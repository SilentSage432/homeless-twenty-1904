"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLAQUE_ASSETS_BUCKET } from "@/lib/supabase/storage";
import { AdminAlert } from "@/components/admin/AdminUi";

type StorageFile = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: { size?: number; mimetype?: string } | null;
};

const PAGE_SIZE = 12;

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StorageInspector() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyName, setBusyName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase client unavailable.");
      setLoading(false);
      return;
    }
    const { data, error: listError } = await supabase.storage
      .from(PLAQUE_ASSETS_BUCKET)
      .list("", {
        limit: PAGE_SIZE + 1,
        offset: page * PAGE_SIZE,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (listError) {
      setError(listError.message);
      setFiles([]);
      setHasMore(false);
    } else {
      const list = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
      setHasMore(list.length > PAGE_SIZE);
      setFiles(list.slice(0, PAGE_SIZE) as StorageFile[]);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  function publicUrl(name: string): string {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return "";
    return supabase.storage.from(PLAQUE_ASSETS_BUCKET).getPublicUrl(name).data
      .publicUrl;
  }

  async function handleDelete(name: string) {
    if (
      !confirm(
        `Delete this photo (“${name}”)?\n\nPlaques that still use it may show a broken image. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyName(name);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error: removeError } = await supabase.storage
      .from(PLAQUE_ASSETS_BUCKET)
      .remove([name]);
    setBusyName(null);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setNotice("Photo deleted from storage.");
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-body text-sm text-charcoal">
          Plaque photos
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="focus-ring tap-target px-1 text-xs tracking-wide text-crimson underline underline-offset-4 disabled:opacity-60"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {notice ? <AdminAlert tone="success">{notice}</AdminAlert> : null}

      {!loading && files.length === 0 && !error ? (
        <p className="font-body text-sm text-slate-weathered py-4">
          No assets on this page.
        </p>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {files.map((file) => (
          <li
            key={file.name}
            className="museum-card overflow-hidden border border-charcoal/12 bg-white/85"
          >
            <div className="relative aspect-square bg-charcoal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(file.name)}
                alt={file.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="px-3 py-2.5">
              <p className="font-mono text-[10px] text-charcoal truncate" title={file.name}>
                {file.name}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-weathered">
                {formatSize(file.metadata?.size)}
              </p>
              <button
                type="button"
                onClick={() => void handleDelete(file.name)}
                disabled={busyName === file.name}
                className="focus-ring tap-target mt-1 px-1 text-xs text-crimson underline underline-offset-4 decoration-crimson/40 hover:decoration-crimson disabled:opacity-60"
              >
                {busyName === file.name ? "Deleting…" : "Delete Asset"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="focus-ring tap-target border border-charcoal/20 px-4 text-sm disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="font-mono text-xs text-slate-weathered">
          Page {page + 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || loading}
          className="focus-ring tap-target border border-charcoal/20 px-4 text-sm disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
