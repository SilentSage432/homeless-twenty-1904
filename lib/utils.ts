import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Build a one-tap Google Maps navigation URL from a stored location.
 * Prefers the saved `map_url` (Places URL), then lat/lng, then the address
 * text. Returns null when there is nothing to link to.
 */
export function buildMapUrl(loc: {
  map_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
}): string | null {
  if (loc.map_url && loc.map_url.trim()) return loc.map_url.trim();
  if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  const address = loc.location?.trim();
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  }
  return null;
}

export function formatEventDate(iso: string): {
  month: string;
  day: string;
  year: string;
  time: string;
  full: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { month: "—", day: "—", year: "—", time: "", full: iso };
  }

  return {
    month: d.toLocaleDateString("en-US", { month: "long" }),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    year: d.toLocaleDateString("en-US", { year: "numeric" }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}
