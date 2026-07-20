import type { Metadata } from "next";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm">
      <AdminDashboardShell />
    </div>
  );
}
