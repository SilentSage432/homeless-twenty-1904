import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ContentManager } from "@/components/admin/ContentManager";

export const metadata: Metadata = {
  title: "Page Content & FAQs",
  robots: { index: false, follow: false },
};

export default function AdminContentPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm">
      <AdminPageShell
        eyebrow="Public site · Homepage & FAQs"
        title="Content & FAQs"
        description="Homepage hero, editable page sections, and the public FAQ list."
      >
        <ContentManager />
      </AdminPageShell>
    </div>
  );
}
