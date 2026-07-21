"use client";

import { useState } from "react";
import { authorizedFetch } from "@/lib/supabase/staff-api";
import { AdminAlert } from "@/components/admin/AdminUi";

type RowsResult = { type: "rows"; rows: Record<string, unknown>[] };
type CommandResult = { type: "command"; rowCount: number };
type QueryResult = RowsResult | CommandResult;

function isReadOnly(sql: string): boolean {
  const t = sql.trim().toLowerCase();
  return (
    t.startsWith("select") ||
    t.startsWith("with") ||
    t.startsWith("table") ||
    t.startsWith("values")
  );
}

/** Trim whitespace and strip trailing semicolons so subquery wrapping never breaks. */
function sanitizeQuery(sql: string): string {
  return sql.trim().replace(/;+\s*$/g, "").trim();
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function SqlConsole() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [rowsResult, setRowsResult] = useState<RowsResult | null>(null);
  const [commandMessage, setCommandMessage] = useState<string | null>(null);

  function resetOutput() {
    setError(null);
    setHint(null);
    setRowsResult(null);
    setCommandMessage(null);
  }

  async function run() {
    const sanitized = sanitizeQuery(query);
    if (!sanitized) return;

    const writeOp = !isReadOnly(sanitized);
    if (writeOp) {
      if (
        !confirm(
          "This is a write / DDL statement and will modify the database. Continue?"
        )
      ) {
        return;
      }
    }

    setRunning(true);
    resetOutput();

    try {
      const res = await authorizedFetch("/api/admin/query", {
        method: "POST",
        body: JSON.stringify({ query: sanitized }),
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

      const result = payload.result;
      if (result?.type === "rows") {
        setRowsResult(result);
      } else if (result?.type === "command") {
        const count = result.rowCount;
        setCommandMessage(
          `Query executed successfully · ${count} row${count === 1 ? "" : "s"} affected.`
        );
        // Clear the input after a successful write / DDL statement.
        setQuery("");
      } else {
        setCommandMessage("Query executed successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed.");
    } finally {
      setRunning(false);
    }
  }

  const columns =
    rowsResult && rowsResult.rows.length > 0
      ? Object.keys(rowsResult.rows[0])
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
          placeholder="select id, title from plaques order by date_placed desc limit 20"
          className="admin-input focus-ring resize-y font-mono text-sm"
          disabled={running}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={running || sanitizeQuery(query) === ""}
          className="focus-ring btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm tracking-wide disabled:opacity-60"
        >
          {running ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-parchment/40 border-t-parchment"
                aria-hidden="true"
              />
              Running…
            </>
          ) : (
            "Run query"
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            resetOutput();
          }}
          disabled={running}
          className="focus-ring border border-charcoal/20 px-4 py-2.5 text-sm museum-ease hover:border-charcoal/40 disabled:opacity-60"
        >
          Clear
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="border-l-4 border-crimson bg-crimson/[0.07] px-4 py-3"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-crimson">
            Query error
          </p>
          <p className="mt-1 break-words font-mono text-sm text-crimson">
            {error}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-crimson/80">{hint}</p>
          ) : null}
        </div>
      ) : null}

      {commandMessage ? (
        <div
          role="status"
          className="flex items-start gap-3 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3"
        >
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
            aria-hidden="true"
          >
            ✓
          </span>
          <p className="font-body text-sm font-medium text-emerald-800">
            {commandMessage}
          </p>
        </div>
      ) : null}

      {rowsResult ? (
        rowsResult.rows.length === 0 ? (
          <div className="border border-charcoal/15 bg-white/85 px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal">
              Results (0 rows)
            </p>
            <p className="mt-1 font-body text-sm text-slate-weathered">
              Query executed successfully but returned no rows.
            </p>
          </div>
        ) : (
          <div className="border border-charcoal/15 bg-white/85">
            <div className="flex items-center justify-between gap-2 border-b border-charcoal/12 px-4 py-2.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal">
                Results ({rowsResult.rows.length} row
                {rowsResult.rows.length === 1 ? "" : "s"})
              </p>
              <p className="font-mono text-[10px] text-slate-weathered">
                {columns.length} column{columns.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="overflow-x-auto">
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
                  {rowsResult.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-charcoal/10 align-top odd:bg-parchment/40"
                    >
                      {columns.map((col) => {
                        const text = cellText(row[col]);
                        return (
                          <td
                            key={col}
                            className="max-w-[18rem] truncate px-3 py-2 font-mono text-xs text-charcoal"
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
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
