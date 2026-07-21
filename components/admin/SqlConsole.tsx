"use client";

import { useState } from "react";
import { authorizedFetch } from "@/lib/supabase/staff-api";
import { AdminAlert } from "@/components/admin/AdminUi";

type RowsResult = { type: "rows"; rows: Record<string, unknown>[] };
type CommandResult = { type: "command"; rowCount: number };
type QueryResult = RowsResult | CommandResult;

function isReadOnly(sql: string): boolean {
  const t = sql.trim().toLowerCase();
  return t.startsWith("select") || t.startsWith("with") || t.startsWith("table") || t.startsWith("values");
}

export function SqlConsole() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  async function run() {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (!isReadOnly(trimmed)) {
      if (
        !confirm(
          "This is a write / DDL statement and will modify the database. Continue?"
        )
      ) {
        return;
      }
    }

    setRunning(true);
    setError(null);
    setHint(null);
    setResult(null);

    try {
      const res = await authorizedFetch("/api/admin/query", {
        method: "POST",
        body: JSON.stringify({ query: trimmed }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        result?: QueryResult;
        error?: string;
        hint?: string;
      };
      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "Query failed.");
        setHint(payload.hint ?? null);
        return;
      }
      setResult(payload.result ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed.");
    } finally {
      setRunning(false);
    }
  }

  const columns =
    result?.type === "rows" && result.rows.length > 0
      ? Object.keys(result.rows[0])
      : [];

  return (
    <div className="space-y-4">
      <AdminAlert tone="error">
        Emergency executor — runs with elevated privileges under your developer
        clearance. Statements are irreversible. Prefer migrations for schema
        changes.
      </AdminAlert>

      <div>
        <label className="admin-label" htmlFor="sql-console">
          SQL statement
        </label>
        <textarea
          id="sql-console"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={7}
          spellCheck={false}
          placeholder="select id, title from plaques order by date_placed desc limit 20;"
          className="admin-input focus-ring resize-y font-mono text-sm"
          disabled={running}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={running || query.trim() === ""}
          className="focus-ring btn-primary px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
        >
          {running ? "Running…" : "Run query"}
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setResult(null);
            setError(null);
            setHint(null);
          }}
          disabled={running}
          className="focus-ring border border-charcoal/20 px-4 py-2.5 text-sm museum-ease hover:border-charcoal/40 disabled:opacity-60"
        >
          Clear
        </button>
      </div>

      {error ? (
        <AdminAlert tone="error">
          {error}
          {hint ? <span className="mt-1 block text-xs opacity-80">{hint}</span> : null}
        </AdminAlert>
      ) : null}

      {result?.type === "command" ? (
        <AdminAlert tone="success">
          Statement executed · {result.rowCount} row
          {result.rowCount === 1 ? "" : "s"} affected.
        </AdminAlert>
      ) : null}

      {result?.type === "rows" ? (
        result.rows.length === 0 ? (
          <p className="font-body text-sm text-slate-weathered">
            Query returned 0 rows.
          </p>
        ) : (
          <div className="overflow-x-auto border border-charcoal/15 bg-white/85">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-charcoal text-parchment">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-t border-charcoal/10 align-top">
                    {columns.map((col) => {
                      const value = row[col];
                      const text =
                        value === null || value === undefined
                          ? "—"
                          : typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value);
                      return (
                        <td
                          key={col}
                          className="max-w-[16rem] truncate px-3 py-2 font-mono text-xs text-charcoal"
                          title={text}
                        >
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-charcoal/10 px-3 py-2 font-mono text-[10px] text-slate-weathered">
              {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}
