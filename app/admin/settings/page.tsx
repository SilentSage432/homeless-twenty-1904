import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";

export const metadata: Metadata = {
  title: "Site Settings",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm">
      <AdminPageShell
        eyebrow="CMS · Global Configuration"
        title="Site Settings & Banner"
        description="Announcement banner, lodge metadata, and feature flags for the public site."
      >
        <SiteSettingsManager />
      </AdminPageShell>
    </div>
  );
}
