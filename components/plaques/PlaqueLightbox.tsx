"use client";

import Image from "next/image";
import type { PlaqueRow } from "@/lib/supabase/database.types";
import { buildMapUrl } from "@/lib/utils";

/**
 * Full plaque detail modal. Shared by the grid gallery and the discovery map
 * so "View Details" opens an identical experience from either surface.
 */
export function PlaqueLightbox({
  plaque,
  onClose,
}: {
  plaque: PlaqueRow | null;
  onClose: () => void;
}) {
  if (!plaque) return null;
  const mapUrl = buildMapUrl(plaque);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Plaque detail: ${plaque.title}`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
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
          onClick={onClose}
          aria-label="Close plaque lightbox"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="relative w-full aspect-[16/10] bg-charcoal">
          {plaque.image_url && (
            <Image
              src={plaque.image_url}
              alt={plaque.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          )}
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-crimson text-xs tracking-[0.2em] uppercase mb-2">
            {plaque.location}
          </p>
          <h3 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold mb-3">
            {plaque.title}
          </h3>
          <div className="h-px w-12 bg-gold mb-4" aria-hidden="true" />
          <p className="font-body text-base sm:text-lg leading-relaxed text-parchment-ink/85">
            {plaque.description}
          </p>
          {plaque.date_placed && (
            <p className="mt-4 text-sm text-slate-weathered">
              Placed{" "}
              {new Date(plaque.date_placed + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )}
            </p>
          )}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-base tracking-wide"
              aria-label={`Navigate to ${plaque.title} on Google Maps`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              Navigate / View on Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
