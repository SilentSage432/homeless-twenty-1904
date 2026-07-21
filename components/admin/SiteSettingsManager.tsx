"use client";

import { useEffect, useState } from "react";
import {
  AdminAlert,
  AdminField,
  AdminSection,
  AdminSelect,
  AdminTextArea,
} from "@/components/admin/AdminUi";
import { AnnouncementBannerView } from "@/components/AnnouncementBanner";
import { getSessionUserId } from "@/lib/supabase/auth";
import { requestRevalidate } from "@/lib/supabase/staff-api";
import {
  fetchSiteSettings,
  updateSiteSettings,
  defaultSiteSettings,
} from "@/lib/supabase/cms";
import type {
  AnnouncementBanner,
  AnnouncementType,
  FeatureFlags,
  LodgeInfo,
} from "@/lib/supabase/database.types";

const BANNER_TYPES: { value: AnnouncementType; label: string }[] = [
  { value: "info", label: "Info — brass notice" },
  { value: "alert", label: "Alert — crimson" },
  { value: "event", label: "Event — gold" },
];

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border border-charcoal/15 bg-white/70 px-4 py-3">
      <span className="font-body text-sm text-charcoal">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-crimson" : "bg-charcoal/25"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-parchment transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function SiteSettingsManager() {
  const [banner, setBanner] = useState<AnnouncementBanner>(
    defaultSiteSettings().announcement_banner
  );
  const [lodge, setLodge] = useState<LodgeInfo>(defaultSiteSettings().lodge_info);
  const [flags, setFlags] = useState<FeatureFlags>(
    defaultSiteSettings().feature_flags
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSiteSettings().then((s) => {
      if (cancelled) return;
      setBanner(s.announcement_banner);
      setLodge(s.lodge_info);
      setFlags(s.feature_flags);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const userId = await getSessionUserId();
    const { error: saveError } = await updateSiteSettings(
      { announcement_banner: banner, lodge_info: lodge, feature_flags: flags },
      userId
    );
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    await requestRevalidate(["/", "/about", "/plaques"]);
    setMessage("Settings saved and published — the public site updates now.");
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-slate-weathered">Loading settings…</p>
    );
  }

  return (
    <div className="space-y-8">
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <AdminSection
        eyebrow="Global · Announcement"
        title="Announcement Banner"
        description="A dismissible bar pinned to the top of every public page. Toggle it on for closures, urgent notices, or upcoming events."
        deck
      >
        <div className="space-y-4">
          <Toggle
            label="Show announcement banner on the public site"
            checked={banner.enabled}
            onChange={(v) => setBanner((b) => ({ ...b, enabled: v }))}
          />
          <AdminTextArea
            label="Message"
            rows={2}
            value={banner.message}
            onChange={(v) => setBanner((b) => ({ ...b, message: v }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Link URL (optional)"
              value={banner.link_url}
              onChange={(v) => setBanner((b) => ({ ...b, link_url: v }))}
              placeholder="/events or https://…"
            />
            <AdminSelect
              label="Style"
              value={banner.type}
              onChange={(v) =>
                setBanner((b) => ({ ...b, type: v as AnnouncementType }))
              }
              options={BANNER_TYPES}
            />
          </div>

          <div>
            <p className="admin-label mb-2">Live preview</p>
            <div className="overflow-hidden border border-charcoal/15">
              <AnnouncementBannerView
                banner={{
                  ...banner,
                  message:
                    banner.message.trim() ||
                    "Your announcement message appears here.",
                }}
                preview
              />
            </div>
            {!banner.enabled ? (
              <p className="mt-1.5 text-xs text-slate-weathered">
                Banner is currently hidden from the public site.
              </p>
            ) : null}
          </div>
        </div>
      </AdminSection>

      <AdminSection
        eyebrow="Lodge · Metadata"
        title="Lodge Information"
        description="Contact and meeting details surfaced across the site and footer."
        deck
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label="Phone"
            type="tel"
            value={lodge.phone}
            onChange={(v) => setLodge((l) => ({ ...l, phone: v }))}
          />
          <AdminField
            label="Address"
            value={lodge.address}
            onChange={(v) => setLodge((l) => ({ ...l, address: v }))}
          />
          <AdminField
            label="Hours"
            value={lodge.hours}
            onChange={(v) => setLodge((l) => ({ ...l, hours: v }))}
            placeholder="Mon–Fri, 9–5"
          />
          <AdminField
            label="Meeting schedule"
            value={lodge.meeting_schedule}
            onChange={(v) => setLodge((l) => ({ ...l, meeting_schedule: v }))}
            placeholder="Second Tuesday, 7pm"
          />
          <AdminField
            label="Facebook URL"
            value={lodge.social_facebook}
            onChange={(v) => setLodge((l) => ({ ...l, social_facebook: v }))}
          />
          <AdminField
            label="Instagram URL"
            value={lodge.social_instagram}
            onChange={(v) => setLodge((l) => ({ ...l, social_instagram: v }))}
          />
        </div>
      </AdminSection>

      <AdminSection
        eyebrow="Operations · Feature Flags"
        title="Feature Flags"
        description="Turn public capabilities on or off without a redeploy."
        deck
      >
        <div className="space-y-3">
          <Toggle
            label="Allow inquiries (Contact the Lodge form)"
            checked={flags.allow_inquiries}
            onChange={(v) => setFlags((f) => ({ ...f, allow_inquiries: v }))}
          />
          <Toggle
            label="Allow event RSVPs / pre-pay prompts"
            checked={flags.allow_rsvps}
            onChange={(v) => setFlags((f) => ({ ...f, allow_rsvps: v }))}
          />
          <Toggle
            label="Show interactive plaque map"
            checked={flags.show_interactive_map}
            onChange={(v) => setFlags((f) => ({ ...f, show_interactive_map: v }))}
          />
        </div>
      </AdminSection>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="focus-ring btn-primary px-7 py-3 text-sm tracking-wide disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save all settings"}
        </button>
      </div>
    </div>
  );
}
