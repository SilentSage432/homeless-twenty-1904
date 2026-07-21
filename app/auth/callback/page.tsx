import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCallbackHandler } from "@/components/admin/AuthCallbackHandler";

export const metadata: Metadata = {
  title: "Finalizing sign-in",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <div className="min-h-[80vh] bg-parchment-warm/40">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg px-4 py-28 text-center font-body text-slate-weathered">
            Finalizing sign-in…
          </div>
        }
      >
        <AuthCallbackHandler />
      </Suspense>
    </div>
  );
}
