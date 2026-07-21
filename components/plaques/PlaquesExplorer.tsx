"use client";

import { useState } from "react";
import { PlaquesGallery } from "@/components/plaques/PlaquesGallery";
import { PlaqueMap } from "@/components/plaques/PlaqueMap";

type View = "grid" | "map";

export function PlaquesExplorer() {
  const [view, setView] = useState<View>("grid");

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
            Historical Plaque Gallery
          </h2>
          <div className="ornament-rule max-w-xs mx-auto mb-5" aria-hidden="true">
            <span className="ornament-diamond" />
          </div>
          <p className="font-body text-lg leading-relaxed text-slate-weathered">
            Markers placed across the Magic Valley and Eastern Idaho — each one a
            permanent record of people, places, and passages worth preserving.
          </p>
        </div>

        <div
          className="mx-auto mb-10 flex w-full max-w-xs items-center rounded-sm border border-charcoal/20 bg-parchment p-1"
          role="tablist"
          aria-label="Plaque view"
        >
          <ViewTab
            active={view === "grid"}
            onClick={() => setView("grid")}
            label="Grid View"
          />
          <ViewTab
            active={view === "map"}
            onClick={() => setView("map")}
            label="Map View"
          />
        </div>

        {view === "grid" ? <PlaquesGallery bare /> : <PlaqueMap />}
      </div>
    </section>
  );
}

function ViewTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "focus-ring flex-1 bg-charcoal px-4 py-2.5 text-sm tracking-wide text-parchment museum-ease"
          : "focus-ring flex-1 bg-transparent px-4 py-2.5 text-sm tracking-wide text-slate-weathered museum-ease hover:text-charcoal"
      }
    >
      {label}
    </button>
  );
}
