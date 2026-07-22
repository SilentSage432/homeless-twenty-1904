"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminAlert } from "@/components/admin/AdminUi";
import { useModalA11y } from "@/lib/hooks/useModalA11y";

type Row = Record<string, unknown>;
type TableKey = "plaques" | "events" | "profiles";

type EditField = {
  key: string;
  label: string;
  type: "text" | "textarea";
  hint?: string;
};

type TableConfig = {
  key: TableKey;
  label: string;
  select: string;
  orderBy: string;
  ascending: boolean;
  timestampKey: string | null;
  titleKey: string;
  metaKeys: string[];
  editFields: EditField[];
  deletable: boolean;
  note?: string;
};

const PAGE_SIZE = 10;

const META_LABELS: Record<string, string> = {
  location: "Location",
  latitude: "Latitude",
  longitude: "Longitude",
  date: "Date",
  label: "Badge",
  role: "Access level",
};

const TABLES: TableConfig[] = [
  {
    key: "plaques",
    label: "Plaques",
    select:
      "id, title, location, description, image_url, latitude, longitude, date_placed",
    orderBy: "date_placed",
    ascending: false,
    timestampKey: "date_placed",
    titleKey: "title",
    metaKeys: ["location", "latitude", "longitude"],
    editFields: [
      { key: "title", label: "Title", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "image_url",
        label: "Image URL",
        type: "text",
        hint: "Link to the photo. Prefer changing photos from Plaque Uploader on the Dashboard.",
      },
    ],
    deletable: true,
  },
  {
    key: "events",
    label: "Events",
    select:
      "id, title, description, date, label, location, payment_url, image_url, created_at",
    orderBy: "date",
    ascending: false,
    timestampKey: "created_at",
    titleKey: "title",
    metaKeys: ["date", "label", "location"],
    editFields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "label", label: "Badge Label", type: "text" },
      { key: "location", label: "Location", type: "text" },
      {
        key: "payment_url",
        label: "Payment URL",
        type: "text",
        hint: "Stripe or payment link shown on the event.",
      },
    ],
    deletable: true,
  },
  {
    key: "profiles",
    label: "Profiles",
    select: "id, full_name, role, updated_at",
    orderBy: "role",
    ascending: true,
    timestampKey: "updated_at",
    titleKey: "full_name",
    metaKeys: ["role"],
    editFields: [],
    deletable: false,
    note: "Profiles are read-only here. To add or remove stewards, use Personnel & Access Control on the Dashboard.",
  },
];

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return String(value);
  return String(value);
}

export function TableExplorer() {
  const [tableKey, setTableKey] = useState<TableKey>("plaques");
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const config = TABLES.find((t) => t.key === tableKey) as TableConfig;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Can't reach the database right now. Refresh the page or try again later."
      );
      setLoading(false);
      return;
    }
    const from = page * PAGE_SIZE;
    const { data, error: queryError } = await supabase
      .from(config.key)
      .select(config.select)
      .order(config.orderBy, { ascending: config.ascending, nullsFirst: false })
      .range(from, from + PAGE_SIZE);

    if (queryError) {
      setError(queryError.message);
      setRows([]);
      setHasMore(false);
    } else {
      const list = (data ?? []) as unknown as Row[];
      setHasMore(list.length > PAGE_SIZE);
      setRows(list.slice(0, PAGE_SIZE));
    }
    setLoading(false);
  }, [config.key, config.select, config.orderBy, config.ascending, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
    setNotice(null);
    setError(null);
  }, [tableKey]);

  async function handleDelete(row: Row) {
    if (!config.deletable) return;
    const id = String(row.id);
    const title = display(row[config.titleKey]);
    const entity = config.label.slice(0, -1).toLowerCase();
    if (
      !confirm(
        `Delete ${entity} “${title === "—" ? "untitled" : title}” permanently?\n\nThis cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(id);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Can't reach the database right now. Refresh the page or try again later."
      );
      setBusyId(null);
      return;
    }
    const { error: delError } = await supabase
      .from(config.key)
      .delete()
      .eq("id", id);
    setBusyId(null);
    if (delError) {
      setError(delError.message);
      return;
    }
    setNotice(`${config.label.slice(0, -1)} deleted.`);
    await load();
  }

  return (
    <div className="space-y-5">
      <p className="font-body text-xs leading-relaxed text-slate-weathered">
        Use this for quick text fixes only. To add photos, set dates, or payment
        links, use Events Manager / Plaque Uploader on the Dashboard.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABLES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTableKey(t.key)}
              className={
                t.key === tableKey
                  ? "focus-ring tap-target border border-charcoal bg-charcoal px-3 text-sm text-parchment"
                  : "focus-ring tap-target border border-charcoal/20 bg-transparent px-3 text-sm text-charcoal museum-ease hover:border-charcoal/40"
              }
            >
              {t.label}
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

      {config.note ? (
        <p className="font-body text-xs text-slate-weathered">{config.note}</p>
      ) : null}
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {notice ? <AdminAlert tone="success">{notice}</AdminAlert> : null}

      {!loading && rows.length === 0 && !error ? (
        <p className="font-body text-sm text-slate-weathered py-4">
          No records on this page.
        </p>
      ) : null}

      <ul className="space-y-3">
        {rows.map((row) => {
          const id = String(row.id);
          return (
            <li
              key={id}
              className="museum-card border border-charcoal/12 bg-white/85 px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg text-charcoal truncate">
                    {display(row[config.titleKey]) === "—"
                      ? "(untitled)"
                      : display(row[config.titleKey])}
                  </p>
                </div>
                {config.timestampKey && row[config.timestampKey] ? (
                  <span className="shrink-0 font-mono text-[10px] text-slate-weathered">
                    {new Date(
                      String(row[config.timestampKey])
                    ).toLocaleDateString()}
                  </span>
                ) : null}
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {config.metaKeys.map((k) => (
                  <div key={k} className="min-w-0">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-weathered">
                      {META_LABELS[k] ?? k}
                    </dt>
                    <dd className="text-sm text-charcoal truncate">
                      {display(row[k])}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 flex gap-4">
                {config.editFields.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="focus-ring tap-target px-1 text-sm text-crimson underline underline-offset-4 decoration-crimson/40 hover:decoration-crimson"
                  >
                    Quick Edit
                  </button>
                ) : null}
                {config.deletable ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    disabled={busyId === id}
                    className="focus-ring tap-target px-1 text-sm text-slate-weathered underline underline-offset-4 hover:text-charcoal disabled:opacity-60"
                  >
                    {busyId === id ? "Deleting…" : "Delete"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
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

      {editing ? (
        <QuickEditModal
          config={config}
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setNotice(`${config.label.slice(0, -1)} updated.`);
            await load();
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function QuickEditModal({
  config,
  row,
  onClose,
  onSaved,
  onError,
}: {
  config: TableConfig;
  row: Row;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of config.editFields) {
      const value = row[field.key];
      initial[field.key] = value == null ? "" : String(value);
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  savingRef.current = saving;

  const handleClose = useCallback(() => {
    if (!savingRef.current) onClose();
  }, [onClose]);

  useModalA11y({
    open: true,
    onClose: handleClose,
    initialFocusRef: cancelRef,
  });

  async function handleSave() {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      onError(
        "Can't reach the database right now. Refresh the page or try again later."
      );
      setSaving(false);
      onClose();
      return;
    }
    const patch: Record<string, string | null> = {};
    for (const field of config.editFields) {
      const trimmed = form[field.key]?.trim() ?? "";
      patch[field.key] = trimmed === "" ? null : trimmed;
    }
    const { error } = await supabase
      .from(config.key)
      // Dynamic table key + field map; validated by editFields config above.
      .update(patch as never)
      .eq("id", String(row.id));
    setSaving(false);
    if (error) {
      onError(error.message);
      onClose();
      return;
    }
    await onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Quick edit record"
    >
      <div
        className="absolute inset-0 bg-charcoal/90"
        aria-hidden="true"
        onClick={saving ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto border border-gold/40 bg-parchment shadow-[var(--shadow-lift)]">
        <div className="border-b border-charcoal/10 bg-charcoal px-5 py-4">
          <p className="font-mono text-gold text-[10px] tracking-[0.24em] uppercase mb-1">
            {config.label} · Quick edit
          </p>
          <p className="font-body text-sm text-parchment/85">
            Limited fields — open Dashboard for the full editor.
          </p>
        </div>
        <div className="space-y-4 px-5 py-5">
          {config.editFields.map((field) => (
            <div key={field.key}>
              <label className="admin-label" htmlFor={`edit-${field.key}`}>
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={`edit-${field.key}`}
                  rows={3}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="admin-input focus-ring resize-y"
                  disabled={saving}
                />
              ) : (
                <input
                  id={`edit-${field.key}`}
                  type="text"
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="admin-input focus-ring"
                  disabled={saving}
                />
              )}
              {field.hint ? (
                <p className="mt-1.5 text-xs text-slate-weathered/90">
                  {field.hint}
                </p>
              ) : null}
            </div>
          ))}
          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <button
              ref={cancelRef}
              type="button"
              onClick={onClose}
              disabled={saving}
              className="focus-ring border border-charcoal/20 px-4 py-2.5 text-sm museum-ease hover:border-charcoal/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
