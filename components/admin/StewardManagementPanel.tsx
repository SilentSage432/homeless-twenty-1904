"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AdminAlert,
  AdminField,
  AdminSection,
  AdminSelect,
} from "@/components/admin/AdminUi";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { authorizedFetch } from "@/lib/supabase/staff-api";
import {
  assignableRolesFor,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase/database.types";

const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "admin — content steward",
  developer: "developer — full cockpit",
  user: "user — public only",
};

export function StewardManagementPanel({
  actorRole,
  currentUserId,
}: {
  actorRole: ProfileRole;
  currentUserId: string;
}) {
  const router = useRouter();
  const roleOptions = useMemo(
    () =>
      assignableRolesFor(actorRole).map((value) => ({
        value,
        label: ROLE_LABELS[value],
      })),
    [actorRole]
  );

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ProfileRole>(
    () => assignableRolesFor(actorRole)[0] ?? "admin"
  );
  const [busy, setBusy] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const allowed = assignableRolesFor(actorRole);
    if (!allowed.includes(role)) {
      setRole(allowed[0] ?? "admin");
    }
  }, [actorRole, role]);

  const loadProfiles = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setListError("Supabase client unavailable.");
      setListLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id, updated_at, full_name, role")
      .order("role", { ascending: true });

    if (queryError) {
      setListError(queryError.message);
      setProfiles([]);
    } else {
      setProfiles(data ?? []);
    }
    setListLoading(false);
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  async function refreshRoster() {
    await loadProfiles();
    router.refresh();
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const res = await authorizedFetch("/api/admin/stewards", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          role,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        setError(payload.error ?? "Invite failed.");
        return;
      }

      setMessage(payload.message ?? "Steward registered.");
      setEmail("");
      setFullName("");
      setRole(assignableRolesFor(actorRole)[0] ?? "admin");
      await refreshRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(target: Profile) {
    if (target.id === currentUserId) return;

    const label = target.full_name?.trim() || target.role;
    if (
      !confirm(
        `Remove ${label}’s access?\n\nThey will no longer be able to sign in to the steward portal. This cannot be undone.`
      )
    ) {
      return;
    }

    setRevokingId(target.id);
    setMessage(null);
    setError(null);

    try {
      const res = await authorizedFetch("/api/admin/stewards", {
        method: "DELETE",
        body: JSON.stringify({ id: target.id }),
      });
      const payload = (await res.json()) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        setError(payload.error ?? "Revoke failed.");
        return;
      }

      setMessage(payload.message ?? "Steward revoked.");
      // Optimistic removal, then re-fetch + refresh.
      setProfiles((prev) => prev.filter((p) => p.id !== target.id));
      await refreshRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed.");
    } finally {
      setRevokingId(null);
    }
  }

  function canShowRevoke(row: Profile): boolean {
    if (row.id === currentUserId) return false;
    if (actorRole === "admin" && row.role === "developer") return false;
    return true;
  }

  return (
    <AdminSection
      eyebrow="Personnel · Access"
      title="Personnel & Access Control"
      description={
        actorRole === "developer"
          ? "Add someone who can manage the lodge site. They’ll use this email to sign in. Choose Admin for day-to-day content, or Developer for system tools."
          : "Add someone who can manage the lodge site. They’ll use this email to sign in. Choose Admin for day-to-day content, or User only if they should not manage the site."
      }
      deck
    >
      <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
        <AdminField
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={setEmail}
          placeholder="steward@lodge.example"
          hint="They will sign in at /admin with this email."
        />
        <AdminField
          label="Full Name"
          required
          value={fullName}
          onChange={setFullName}
          placeholder="Lodge Steward"
        />
        <AdminSelect
          label="Access level"
          required
          value={role}
          onChange={(v) => setRole(v as ProfileRole)}
          options={roleOptions}
          hint="Admin: edit events, plaques, settings, and inquiries. Developer: also system tools."
        />
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy || roleOptions.length === 0}
            className="focus-ring btn-primary w-full px-5 py-3 text-sm tracking-wide disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add steward"}
          </button>
        </div>
      </form>

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.18em] uppercase text-charcoal">
            Active stewards
          </h3>
          <button
            type="button"
            onClick={() => void refreshRoster()}
            disabled={listLoading}
            className="focus-ring tap-target px-1 text-xs tracking-wide text-crimson underline underline-offset-4 disabled:opacity-60"
          >
            {listLoading ? "Refreshing…" : "Refresh list"}
          </button>
        </div>

        {listError ? <AdminAlert tone="error">{listError}</AdminAlert> : null}

        {!listError && !listLoading && profiles.length === 0 ? (
          <p className="font-mono text-xs text-slate-weathered">
            No stewards found, or you don’t have permission to view the list.
          </p>
        ) : null}

        <ul className="divide-y divide-charcoal/10 border border-charcoal/15 bg-white/80">
          {profiles.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-display text-base text-charcoal truncate">
                  {row.full_name?.trim() || "Unnamed steward"}
                  {row.id === currentUserId ? (
                    <span className="ml-2 font-mono text-[10px] tracking-wide uppercase text-gold">
                      you
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-[11px] text-slate-weathered truncate">
                  {row.id}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <span
                  className={`font-mono text-[11px] tracking-wide uppercase px-2 py-1 border ${
                    row.role === "developer"
                      ? "border-gold/50 text-charcoal bg-gold/15"
                      : row.role === "admin"
                        ? "border-crimson/35 text-crimson bg-crimson/[0.06]"
                        : "border-charcoal/20 text-slate-weathered"
                  }`}
                >
                  {row.role}
                </span>
                {row.updated_at ? (
                  <span className="font-mono text-[10px] text-slate-weathered">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </span>
                ) : null}
                {canShowRevoke(row) ? (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(row)}
                    disabled={revokingId === row.id || busy}
                    className="focus-ring tap-target px-1 text-sm text-crimson underline underline-offset-4 decoration-crimson/40 museum-ease hover:decoration-crimson disabled:opacity-60"
                  >
                    {revokingId === row.id ? "Revoking…" : "Revoke"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminSection>
  );
}
