import type { EventRow, PlaqueRow } from "@/lib/supabase/database.types";

const EVENTS_CACHE_KEY = "ht1904:events";
const PLAQUES_CACHE_KEY = "ht1904:plaques";

/** Offline seed — used when Supabase is unset or unreachable. */
export const FALLBACK_EVENTS: EventRow[] = [
  {
    id: "seed-autumn-plaque",
    title: "Autumn Plaque Dedication",
    description:
      "Join the lodge for the unveiling of a new historical marker. Short remarks, fellowship, and a walk to the plaque site. Guests welcome.",
    date: "2026-09-14T13:00:00.000Z",
    label: "Dedication",
    payment_url: null,
    image_url: null,
    created_at: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "seed-heritage-dinner",
    title: "Western Heritage Dinner",
    description:
      "An evening of frontier storytelling, fraternal fellowship, and a plated dinner. Bring a friend who loves local history.",
    date: "2026-10-26T18:00:00.000Z",
    label: "Dinner",
    payment_url: null,
    image_url: null,
    created_at: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "seed-winter-lore",
    title: "Winter Lore Night",
    description:
      "Fireside accounts of forgotten trails, snowbound mail routes, and Magic Valley characters. Open to the curious public.",
    date: "2027-01-17T17:30:00.000Z",
    label: "Lore Night",
    payment_url: null,
    image_url: null,
    created_at: "2026-07-01T00:00:00.000Z",
  },
];

export const FALLBACK_PLAQUES: PlaqueRow[] = [
  {
    id: "seed-snake-river",
    title: "Snake River Crossing Remembrance",
    description:
      "Honors early ford crossings and the perilous passage of wagon companies along the Snake River corridor.",
    image_url:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    location: "Near Twin Falls, ID",
    date_placed: "2022-06-12",
  },
  {
    id: "seed-oregon-trail",
    title: "Oregon Trail Spur Marker",
    description:
      "Commemorates a lesser-known spur of the Oregon Trail used by settlers entering the Magic Valley.",
    image_url:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    location: "Magic Valley, ID",
    date_placed: "2021-09-04",
  },
  {
    id: "seed-homestead",
    title: "Homestead Cabin Site",
    description:
      "Marks the approximate site of an early homestead cabin and the families who weathered the high desert winters.",
    image_url:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
    location: "Eastern Idaho",
    date_placed: "2020-05-18",
  },
  {
    id: "seed-irrigation",
    title: "Irrigation Era Tribute",
    description:
      "Celebrates the canals and ditch riders who turned arid land into the productive Magic Valley.",
    image_url:
      "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&w=800&q=80",
    location: "Jerome County vicinity",
    date_placed: "2023-04-22",
  },
  {
    id: "seed-stage-stop",
    title: "Old Stage Stop",
    description:
      "Remembers a stagecoach stop that linked remote ranches to town before the railroad’s full reach.",
    image_url:
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&q=80",
    location: "Southeast Idaho",
    date_placed: "2019-08-30",
  },
  {
    id: "seed-veterans",
    title: "Veterans of the Range",
    description:
      "A fraternal dedication plaque honoring ranch hands, scouts, and community builders of the Magic Valley frontier.",
    image_url:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    location: "Regional — rotating placement",
    date_placed: null,
  },
];

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readCachedEvents(): EventRow[] {
  if (typeof window === "undefined") return [];
  return safeParse<EventRow[]>(localStorage.getItem(EVENTS_CACHE_KEY)) ?? [];
}

export function writeCachedEvents(events: EventRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function readCachedPlaques(): PlaqueRow[] {
  if (typeof window === "undefined") return [];
  return safeParse<PlaqueRow[]>(localStorage.getItem(PLAQUES_CACHE_KEY)) ?? [];
}

export function writeCachedPlaques(plaques: PlaqueRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAQUES_CACHE_KEY, JSON.stringify(plaques));
  } catch {
    /* quota / private mode — ignore */
  }
}
