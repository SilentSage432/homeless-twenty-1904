import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DocumentManager } from "@/components/admin/DocumentManager";

export const metadata: Metadata = {
  title: "Public Documents",
  robots: { index: false, follow: false },
};

export default function AdminDocumentsPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm">
      <AdminPageShell
        eyebrow="CMS · Documents"
        title="Public Documents"
        description="Upload and manage downloadable files for the public site."
      >
        <DocumentManager />
      </AdminPageShell>
    </div>
  );
}
