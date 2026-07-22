"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlaquesGallery } from "@/components/plaques/PlaquesGallery";
import { PlaqueMap } from "@/components/plaques/PlaqueMap";
import { fetchFeatureFlags } from "@/lib/supabase/cms";

type View = "grid" | "map";

function parseView(raw: string | null | undefined): View {
  return raw === "map" ? "map" : "grid";
}

export function PlaquesExplorer({
  initialView = "grid",
}: {
  /** Server-resolved starting tab from `?view=map`. */
  initialView?: View;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>(initialView);
  const [showMap, setShowMap] = useState(true);

  // Keep local state in sync when the query string changes (e.g. in-app CTA).
  useEffect(() => {
    setView(parseView(searchParams.get("view") ?? initialView));
  }, [searchParams, initialView]);

  useEffect(() => {
    let cancelled = false;
    void fetchFeatureFlags().then((flags) => {
      if (cancelled) return;
      setShowMap(flags.show_interactive_map);
      if (!flags.show_interactive_map) setView("grid");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectView = useCallback(
    (next: View) => {
      setView(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "map") params.set("view", "map");
      else params.delete("view");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <section
      id="plaques"
      className="scroll-mt-24 py-20 sm:py-28 bg-parchment-warm/50"
      aria-labelledby="plaques-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
            Physical Markers
          </p>
          <h2
            id="plaques-heading"
            className="font-display text-charcoal text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-5"
          >
            Plaque Gallery
          </h2>
          <div className="ornament-rule max-w-xs mx-auto mb-5" aria-hidden="true">
            <span className="ornament-diamond" />
          </div>
          <p className="font-body text-lg leading-relaxed text-slate-weathered">
            Markers placed across the Magic Valley and Eastern Idaho — each one a
            permanent record of people, places, and passages worth preserving.
          </p>
        </div>

        {showMap ? (
          <div
            className="mx-auto mb-10 flex w-full max-w-xs items-center rounded-sm border border-charcoal/20 bg-parchment p-1"
            role="tablist"
            aria-label="Plaque view"
          >
            <ViewTab
              id="plaques-tab-grid"
              panelId="plaques-panel-grid"
              active={view === "grid"}
              onClick={() => selectView("grid")}
              label="Grid View"
            />
            <ViewTab
              id="plaques-tab-map"
              panelId="plaques-panel-map"
              active={view === "map"}
              onClick={() => selectView("map")}
              label="Map View"
            />
          </div>
        ) : null}

        <div
          id={showMap && view === "map" ? "plaques-panel-map" : "plaques-panel-grid"}
          role="tabpanel"
          aria-labelledby={
            showMap && view === "map" ? "plaques-tab-map" : "plaques-tab-grid"
          }
        >
          {showMap && view === "map" ? <PlaqueMap /> : <PlaquesGallery bare />}
        </div>
      </div>
    </section>
  );
}

function ViewTab({
  id,
  panelId,
  active,
  onClick,
  label,
}: {
  id: string;
  panelId: string;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={
        active
          ? "focus-ring flex-1 min-h-[44px] bg-charcoal px-4 py-2.5 text-sm tracking-wide text-parchment museum-ease"
          : "focus-ring flex-1 min-h-[44px] bg-transparent px-4 py-2.5 text-sm tracking-wide text-slate-weathered museum-ease hover:text-charcoal"
      }
    >
      {label}
    </button>
  );
}
