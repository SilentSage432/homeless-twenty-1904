"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { fetchPlaques } from "@/lib/supabase/content";
import type { PlaqueRow } from "@/lib/supabase/database.types";
import { buildMapUrl } from "@/lib/utils";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID,
  MAGIC_VALLEY_CENTER,
  VINTAGE_MAP_STYLES,
  isGoogleMapsConfigured,
} from "@/lib/maps";
import { PlaqueLightbox } from "@/components/plaques/PlaqueLightbox";

type MappedPlaque = PlaqueRow & { latitude: number; longitude: number };

function isMapped(p: PlaqueRow): p is MappedPlaque {
  return typeof p.latitude === "number" && typeof p.longitude === "number";
}

const MAP_CONTAINER_STYLE: CSSProperties = { width: "100%", height: "100%" };

// Teardrop pin — crimson body with a gold center to match the vintage palette.
const PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46"><path d="M17 0C7.611 0 0 7.611 0 17c0 12.02 17 29 17 29s17-16.98 17-29C34 7.611 26.389 0 17 0z" fill="#8b1e1e"/><circle cx="17" cy="17" r="6.5" fill="#c9a227"/></svg>`
);
const PIN_URL = `data:image/svg+xml;charset=UTF-8,${PIN_SVG}`;

export function PlaqueMap() {
  const { data, isLoading } = useQuery({
    queryKey: ["plaques"],
    queryFn: fetchPlaques,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [active, setActive] = useState<PlaqueRow | null>(null);

  const mapped = useMemo(
    () => (data?.data ?? []).filter(isMapped),
    [data]
  );
  const selected = mapped.find((p) => p.id === selectedId) ?? null;

  // Fit the viewport to the plaques once both the map and data are ready.
  useEffect(() => {
    if (!map || mapped.length === 0) return;
    if (mapped.length === 1) {
      map.setCenter({ lat: mapped[0].latitude, lng: mapped[0].longitude });
      map.setZoom(13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    mapped.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds, 72);
  }, [map, mapped]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (!isGoogleMapsConfigured() || loadError) {
    return (
      <div className="museum-card border border-charcoal/15 bg-parchment-warm/60 px-6 py-16 text-center">
        <p className="font-display text-xl text-charcoal mb-2">
          Discovery map unavailable
        </p>
        <p className="font-body text-sm text-slate-weathered">
          {loadError
            ? "Google Maps failed to load. Please try again later."
            : "The map requires a Google Maps API key. Switch to Grid View to browse plaques."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden rounded-sm border border-gold/40 shadow-[var(--shadow-panel)]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={MAGIC_VALLEY_CENTER}
            zoom={9}
            onLoad={(m) => setMap(m)}
            onUnmount={() => setMap(null)}
            onClick={() => setSelectedId(null)}
            options={{
              styles: VINTAGE_MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: true,
              fullscreenControl: true,
              gestureHandling: "cooperative",
              backgroundColor: "#f2e9d8",
            }}
          >
            {mapped.map((plaque) => (
              <MarkerF
                key={plaque.id}
                position={{ lat: plaque.latitude, lng: plaque.longitude }}
                title={plaque.title}
                onClick={() => setSelectedId(plaque.id)}
                icon={{
                  url: PIN_URL,
                  scaledSize: new google.maps.Size(34, 46),
                  anchor: new google.maps.Point(17, 46),
                }}
              />
            ))}

            {selected ? (
              <InfoWindowF
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelectedId(null)}
                options={{ pixelOffset: new google.maps.Size(0, -42) }}
              >
                <div className="w-56 font-body text-charcoal">
                  {selected.image_url ? (
                    <div className="mb-2 h-28 w-full overflow-hidden bg-charcoal">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.image_url}
                        alt={selected.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <p className="text-[10px] uppercase tracking-[0.16em] text-crimson">
                    {selected.location}
                  </p>
                  <h3 className="font-display text-base leading-snug text-charcoal">
                    {selected.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActive(selected);
                        setSelectedId(null);
                      }}
                      className="focus-ring bg-charcoal px-3 py-1.5 text-xs tracking-wide text-parchment hover:bg-charcoal/90"
                    >
                      View Details
                    </button>
                    {buildMapUrl(selected) ? (
                      <a
                        href={buildMapUrl(selected) as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring border border-crimson px-3 py-1.5 text-xs tracking-wide text-crimson hover:bg-crimson hover:text-parchment"
                      >
                        Get Directions
                      </a>
                    ) : null}
                  </div>
                </div>
              </InfoWindowF>
            ) : null}
          </GoogleMap>
        ) : (
          <div className="flex h-full items-center justify-center bg-parchment-warm/60">
            <p className="font-body text-slate-weathered">Loading map…</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="font-body text-sm text-slate-weathered">
          {isLoading
            ? "Loading plaques…"
            : `${mapped.length} plaque${mapped.length === 1 ? "" : "s"} mapped`}
        </p>
        {!isLoading && mapped.length === 0 ? (
          <p className="font-body text-sm text-slate-weathered">
            No geolocated plaques yet — add coordinates from the dashboard.
          </p>
        ) : null}
      </div>

      <PlaqueLightbox plaque={active} onClose={() => setActive(null)} />
    </div>
  );
}
