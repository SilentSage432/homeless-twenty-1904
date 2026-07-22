"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminAlert } from "@/components/admin/AdminUi";
import { fetchInquiries, updateInquiry } from "@/lib/supabase/cms";
import type { InquiryRow, InquiryStatus } from "@/lib/supabase/database.types";

const FILTERS: { value: InquiryStatus | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "border-crimson/40 text-crimson bg-crimson/[0.06]",
  replied: "border-emerald-600/40 text-emerald-700 bg-emerald-50",
  archived: "border-charcoal/25 text-slate-weathered bg-charcoal/[0.04]",
};

const FRIENDLY_ERROR =
  "Couldn't save — please try again. If it keeps failing, ask a developer for help.";

export function InquiryInbox() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [filter, setFilter] = useState<InquiryStatus | "all">("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInquiries();
      setRows(data);
      setDraftNotes(
        Object.fromEntries(data.map((r) => [r.id, r.notes ?? ""]))
      );
    } catch {
      setError("Couldn't load inquiries. Refresh the page or try again shortly.");
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(row: InquiryRow, status: InquiryStatus) {
    setBusyId(row.id);
    setError(null);
    setMessage(null);
    const { error: e } = await updateInquiry(row.id, { status });
    setBusyId(null);
    if (e) {
      setError(FRIENDLY_ERROR);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    if (status === "replied") setMessage("Marked as replied.");
    else if (status === "archived") setMessage("Moved to Archived.");
    else setMessage("Restored to New.");
  }

  async function saveNotes(row: InquiryRow) {
    setBusyId(row.id);
    setError(null);
    setMessage(null);
    const notes = draftNotes[row.id] ?? "";
    const { error: e } = await updateInquiry(row.id, { notes });
    setBusyId(null);
    if (e) {
      setError(FRIENDLY_ERROR);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, notes } : r)));
    setMessage("Notes saved.");
  }

  const visible =
    filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const counts = {
    new: rows.filter((r) => r.status === "new").length,
    replied: rows.filter((r) => r.status === "replied").length,
    archived: rows.filter((r) => r.status === "archived").length,
  };

  return (
    <div className="space-y-5">
      <p className="font-body text-sm leading-relaxed text-slate-weathered">
        Open the sender&apos;s email to reply outside this portal, then mark the
        message as Replied. Archive hides it from New without deleting. Steward
        notes are private — visitors never see them.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Inquiry filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={f.value === filter}
              onClick={() => setFilter(f.value)}
              className={
                f.value === filter
                  ? "focus-ring min-h-[44px] border border-charcoal bg-charcoal px-3.5 py-2 text-sm text-parchment"
                  : "focus-ring min-h-[44px] border border-parchment/40 bg-parchment/70 px-3.5 py-2 text-sm text-charcoal museum-ease hover:border-charcoal/40"
              }
            >
              {f.label}
              {f.value === "new" && counts.new > 0 ? (
                <span className="ml-1.5 rounded-full bg-crimson px-1.5 py-0.5 text-[10px] text-parchment">
                  {counts.new}
                </span>
              ) : null}
            </button>
          ))}
        </div>
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
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      {!loading && visible.length === 0 ? (
        <p className="font-body text-sm text-slate-weathered py-6 text-center">
          No {filter === "all" ? "" : filter} inquiries.
        </p>
      ) : null}

      <ul className="space-y-4">
        {visible.map((row) => (
          <li
            key={row.id}
            className="admin-panel rounded-sm p-5 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg text-charcoal">
                  {row.name}{" "}
                  <span
                    className={`ml-1 inline-block border px-2 py-0.5 align-middle font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[row.status]}`}
                  >
                    {row.status}
                  </span>
                </p>
                <p className="font-mono text-xs text-slate-weathered">
                  <a
                    href={`mailto:${row.email}`}
                    className="focus-ring underline underline-offset-2 hover:text-crimson"
                  >
                    {row.email}
                  </a>
                  {row.phone ? ` · ${row.phone}` : ""}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-slate-weathered">
                {new Date(row.created_at).toLocaleString()}
              </span>
            </div>

            {row.subject ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold-muted">
                {row.subject}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-charcoal">
              {row.message}
            </p>

            <div>
              <label className="admin-label" htmlFor={`notes-${row.id}`}>
                Steward notes (internal)
              </label>
              <textarea
                id={`notes-${row.id}`}
                rows={2}
                value={draftNotes[row.id] ?? ""}
                onChange={(e) =>
                  setDraftNotes((d) => ({ ...d, [row.id]: e.target.value }))
                }
                className="admin-input focus-ring resize-y"
                placeholder="Add a private note…"
              />
              <p className="mt-1.5 text-xs text-slate-weathered/90">
                Only stewards can see these notes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void saveNotes(row)}
                disabled={busyId === row.id}
                className="focus-ring min-h-[44px] border border-charcoal/20 px-4 py-2 text-sm museum-ease hover:border-charcoal/40 disabled:opacity-60"
              >
                Save notes
              </button>
              {row.status !== "replied" ? (
                <button
                  type="button"
                  onClick={() => void setStatus(row, "replied")}
                  disabled={busyId === row.id}
                  className="focus-ring tap-target px-1 text-sm text-emerald-700 underline underline-offset-4 disabled:opacity-60"
                >
                  Mark as Replied
                </button>
              ) : null}
              {row.status !== "archived" ? (
                <button
                  type="button"
                  onClick={() => void setStatus(row, "archived")}
                  disabled={busyId === row.id}
                  className="focus-ring tap-target px-1 text-sm text-slate-weathered underline underline-offset-4 hover:text-charcoal disabled:opacity-60"
                >
                  Archive
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void setStatus(row, "new")}
                  disabled={busyId === row.id}
                  className="focus-ring tap-target px-1 text-sm text-slate-weathered underline underline-offset-4 hover:text-charcoal disabled:opacity-60"
                >
                  Restore to New
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
