import type { Metadata } from "next";
import { DatabasePortalShell } from "@/components/admin/DatabasePortalShell";

export const metadata: Metadata = {
  title: "Database Portal",
  robots: { index: false, follow: false },
};

export default function AdminDatabasePage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm">
      <DatabasePortalShell />
    </div>
  );
}
