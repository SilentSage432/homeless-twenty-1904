import type { Libraries } from "@react-google-maps/api";

/** Public Google Maps JS API key (browser-safe; restrict by HTTP referrer). */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/**
 * Shared loader id + libraries so every `useJsApiLoader` call resolves to the
 * same singleton script (mismatched options trigger reload warnings/errors).
 */
export const GOOGLE_MAPS_LOADER_ID = "ht1904-google-maps";
export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

export function isGoogleMapsConfigured(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

/** Fallback map center — Twin Falls / Magic Valley, ID. */
export const MAGIC_VALLEY_CENTER = { lat: 42.5558, lng: -114.4701 };

/** Muted, warm map styling to complement the vintage aesthetic. */
export const VINTAGE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f2e9d8" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5b4a36" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f7f1e3" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#a9c7c9" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#e6dcc3" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#cdd7a5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#e9dcbf" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#d8bd8a" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c2a878" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
];
