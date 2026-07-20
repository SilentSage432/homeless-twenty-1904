"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlaques } from "@/lib/supabase/content";
import type { PlaqueRow } from "@/lib/supabase/database.types";

function isRemote(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function PlaquesGallery({
  heading = true,
}: {
  heading?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["plaques"],
    queryFn: fetchPlaques,
  });
  const [active, setActive] = useState<PlaqueRow | null>(null);

  const plaques = data?.data ?? [];

  return (
    <section
      id="plaques"
      className="scroll-mt-24 py-20 sm:py-28 bg-parchment-warm/50"
      aria-labelledby="plaques-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {heading && (
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-crimson text-xs sm:text-sm tracking-[0.22em] uppercase mb-3">
              Physical Markers
            </p>
            <h2
              id="plaques-heading"
              className="font-display text-charcoal text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-5"
            >
              Historical Plaque Gallery
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
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Plaque detail: ${active.title}`}
          onClick={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setActive(null);
          }}
        >
          <div className="absolute inset-0 bg-charcoal/90" aria-hidden="true" />
          <div
            className="relative z-10 w-full max-w-3xl bg-parchment shadow-[var(--shadow-lift)] border border-gold/40 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="focus-ring absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center bg-charcoal text-parchment hover:text-gold"
              onClick={() => setActive(null)}
              aria-label="Close plaque lightbox"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full aspect-[16/10] bg-charcoal">
              {active.image_url && (
                <Image
                  src={active.image_url}
                  alt={active.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              )}
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-crimson text-xs tracking-[0.2em] uppercase mb-2">
                {active.location}
              </p>
              <h3 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold mb-3">
                {active.title}
              </h3>
              <div className="h-px w-12 bg-gold mb-4" aria-hidden="true" />
              <p className="font-body text-base sm:text-lg leading-relaxed text-parchment-ink/85">
                {active.description}
              </p>
              {active.date_placed && (
                <p className="mt-4 text-sm text-slate-weathered">
                  Placed{" "}
                  {new Date(active.date_placed + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
