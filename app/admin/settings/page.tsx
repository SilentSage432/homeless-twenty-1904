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
        eyebrow="Public site · Settings"
        title="Site Settings & Banner"
        description="Announcement banner, lodge contact details, and public-site switches."
      >
        <SiteSettingsManager />
      </AdminPageShell>
    </div>
  );
}
