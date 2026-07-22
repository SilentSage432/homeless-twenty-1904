"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlaques } from "@/lib/supabase/content";
import type { PlaqueRow } from "@/lib/supabase/database.types";
import { PlaqueLightbox } from "@/components/plaques/PlaqueLightbox";

function isRemote(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function PlaquesGallery({
  heading = true,
  bare = false,
}: {
  heading?: boolean;
  /** Render only the grid + lightbox (no section/container) for embedding. */
  bare?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["plaques"],
    queryFn: fetchPlaques,
  });
  const [active, setActive] = useState<PlaqueRow | null>(null);

  const plaques = data?.data ?? [];

  const gridContent = (
    <>
      {isLoading && (
        <p className="text-center text-slate-weathered font-body">
          Loading plaques…
        </p>
      )}

      {!isLoading && plaques.length === 0 && (
        <p className="text-center text-slate-weathered font-body">
          No plaques published yet.
        </p>
      )}

      <div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
        role="list"
      >
        {plaques.map((plaque) => (
          <article
            key={plaque.id}
            className="museum-card group relative overflow-hidden border border-charcoal/10 bg-charcoal shadow-[var(--shadow-panel)] focus-within:ring-2 focus-within:ring-gold"
            role="listitem"
          >
            <button
              type="button"
              className="focus-ring block w-full text-left"
              onClick={() => setActive(plaque)}
              aria-label={`View larger image: ${plaque.title}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-soft">
                {plaque.image_url ? (
                  <Image
                    src={plaque.image_url}
                    alt={plaque.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="museum-media object-cover"
                    unoptimized={isRemote(plaque.image_url) && !plaque.image_url.includes("images.unsplash.com")}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gold/60 font-display text-lg">
                    No image
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-charcoal/92 via-charcoal/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-500 ease-out">
                  <p className="text-gold text-xs tracking-[0.18em] uppercase mb-1">
                    {plaque.location}
                  </p>
                  <h3 className="font-display text-parchment text-xl font-semibold leading-snug">
                    {plaque.title}
                  </h3>
                  <p className="mt-2 text-sm text-parchment/80 line-clamp-2">
                    {plaque.description}
                  </p>
                </div>
              </div>
            </button>
            <div className="sm:hidden bg-charcoal px-4 py-3 border-t border-gold/20">
              <p className="text-gold text-xs tracking-wider uppercase">
                {plaque.location}
              </p>
              <h3 className="font-display text-parchment text-lg">
                {plaque.title}
              </h3>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  if (bare) {
    return (
      <>
        {gridContent}
        <PlaqueLightbox plaque={active} onClose={() => setActive(null)} />
      </>
    );
  }

  return (
    <section
      id="plaques"
      className="scroll-mt-24 py-20 sm:py-28 bg-parchment-warm/50"
      aria-labelledby="plaques-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {heading && (
          <div className="text-center max-w-2xl mx-auto mb-14">
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
              Markers placed across the Magic Valley and Eastern Idaho — each one
              a permanent record of people, places, and passages worth preserving.
            </p>
          </div>
        )}

        {gridContent}
      </div>

      <PlaqueLightbox plaque={active} onClose={() => setActive(null)} />
    </section>
  );
}
