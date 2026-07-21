import { Suspense } from "react";
import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/admin/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Set Password",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm/40">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-28 text-center font-body text-slate-weathered">
            Loading…
          </div>
        }
      >
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
