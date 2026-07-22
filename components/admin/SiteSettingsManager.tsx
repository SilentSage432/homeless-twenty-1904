"use client";

import { useEffect, useState } from "react";
import {
  AdminAlert,
  AdminField,
  AdminSection,
  AdminSelect,
  AdminTextArea,
  AdminToggle,
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
  { value: "info", label: "Info (calm notice)" },
  { value: "alert", label: "Alert (urgent / closure)" },
  { value: "event", label: "Event (upcoming gathering)" },
];

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
          <AdminToggle
            label="Show announcement banner on the public site"
            checked={banner.enabled}
            onChange={(v) => setBanner((b) => ({ ...b, enabled: v }))}
            showStatus
            hint="On: visitors see this message at the top of every public page. Off: the banner is hidden. Remember to Save all settings."
          />
          <AdminTextArea
            label="Message"
            rows={2}
            value={banner.message}
            onChange={(v) => setBanner((b) => ({ ...b, message: v }))}
            hint="Short is best (1–2 sentences). This is the text visitors see in the top bar."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Link URL (optional)"
              value={banner.link_url}
              onChange={(v) => setBanner((b) => ({ ...b, link_url: v }))}
              placeholder="/events or https://…"
              hint="Optional. Example: /events or a full https:// link. Visitors tap the banner to open it."
            />
            <AdminSelect
              label="Style"
              value={banner.type}
              onChange={(v) =>
                setBanner((b) => ({ ...b, type: v as AnnouncementType }))
              }
              options={BANNER_TYPES}
              hint="Color only — does not change who sees the banner."
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
            <p className="mt-1.5 text-xs text-slate-weathered">
              Preview only — click Save all settings to show this on the real
              site.
              {!banner.enabled
                ? " The banner switch is currently off."
                : null}
            </p>
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
            hint="Shown in the site footer and contact areas."
          />
          <AdminField
            label="Address"
            value={lodge.address}
            onChange={(v) => setLodge((l) => ({ ...l, address: v }))}
            hint="Shown in the site footer and contact areas."
          />
          <AdminField
            label="Hours"
            value={lodge.hours}
            onChange={(v) => setLodge((l) => ({ ...l, hours: v }))}
            placeholder="Mon–Fri, 9–5"
            hint="Shown where lodge hours are listed."
          />
          <AdminField
            label="Meeting schedule"
            value={lodge.meeting_schedule}
            onChange={(v) => setLodge((l) => ({ ...l, meeting_schedule: v }))}
            placeholder="Second Tuesday, 7pm"
            hint="Shown where meeting times are listed."
          />
          <AdminField
            label="Facebook URL"
            value={lodge.social_facebook}
            onChange={(v) => setLodge((l) => ({ ...l, social_facebook: v }))}
            hint="Used for footer social links. Leave blank to hide."
          />
          <AdminField
            label="Instagram URL"
            value={lodge.social_instagram}
            onChange={(v) => setLodge((l) => ({ ...l, social_instagram: v }))}
            hint="Used for footer social links. Leave blank to hide."
          />
        </div>
      </AdminSection>

      <AdminSection
        eyebrow="Public site · Switches"
        title="Public site switches"
        description="Simple on/off switches for public-site features. Save settings, then use Preview page to confirm what visitors see."
        deck
      >
        <div className="space-y-3">
          <AdminToggle
            label="Allow inquiries"
            checked={flags.allow_inquiries}
            onChange={(v) => setFlags((f) => ({ ...f, allow_inquiries: v }))}
            showStatus
            previewHref="/"
            previewLabel="Preview home page ↗"
            hint="On: the Contact the Lodge form is available across the site (header, footer, and contact buttons). Off: the form is hidden and new messages are not accepted."
          />
          <AdminToggle
            label="Allow event RSVPs"
            checked={flags.allow_rsvps}
            onChange={(v) => setFlags((f) => ({ ...f, allow_rsvps: v }))}
            showStatus
            previewHref="/events"
            previewLabel="Preview events page ↗"
            hint="On: registration and pre-pay buttons appear on event listings. Off: those buttons are hidden so visitors cannot start RSVP or payment from the Events page."
          />
          <AdminToggle
            label="Show interactive plaque map"
            checked={flags.show_interactive_map}
            onChange={(v) =>
              setFlags((f) => ({ ...f, show_interactive_map: v }))
            }
            showStatus
            previewHref="/plaques"
            previewLabel="Preview plaques page ↗"
            hint="On: the Plaque Gallery (/plaques) includes a map with location pins alongside the photo grid. Off: only the photo grid is shown — the map toggle is hidden."
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
