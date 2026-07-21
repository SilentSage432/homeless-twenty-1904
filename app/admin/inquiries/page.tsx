import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { InquiryInbox } from "@/components/admin/InquiryInbox";

export const metadata: Metadata = {
  title: "Inquiry Inbox",
  robots: { index: false, follow: false },
};

export default function AdminInquiriesPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm">
      <AdminPageShell
        eyebrow="CMS · Correspondence"
        title="Inquiry Inbox"
        description="Contact submissions from the public site. Triage, reply, and keep internal notes."
      >
        <InquiryInbox />
      </AdminPageShell>
    </div>
  );
}
