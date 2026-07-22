import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaquesExplorer } from "@/components/plaques/PlaquesExplorer";

export const metadata: Metadata = {
  title: "Plaque Gallery",
  description:
    "Browse historical plaques placed by Homeless Twenty 1904 across the Magic Valley and Eastern Idaho — in a grid or on an interactive discovery map.",
};

type PlaquesPageProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function PlaquesPage({ searchParams }: PlaquesPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.view) ? params.view[0] : params.view;
  const initialView = raw === "map" ? "map" : "grid";

  return (
    <div className="pt-16">
      <Suspense
        fallback={
          <p className="mx-auto max-w-7xl px-4 py-28 font-body text-slate-weathered">
            Loading plaque gallery…
          </p>
        }
      >
        <PlaquesExplorer initialView={initialView} />
      </Suspense>
    </div>
  );
}
