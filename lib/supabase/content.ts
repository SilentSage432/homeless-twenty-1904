import type {
  EventInsert,
  EventRow,
  EventUpdate,
  PlaqueInsert,
  PlaqueRow,
  PlaqueUpdate,
} from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  FALLBACK_EVENTS,
  FALLBACK_PLAQUES,
  readCachedEvents,
  readCachedPlaques,
  writeCachedEvents,
  writeCachedPlaques,
} from "@/lib/data/fallback";

export type ContentSource = "supabase" | "cache" | "seed";

/**
 * Live `events` take absolute priority.
 * Successful Supabase responses (including empty arrays) are returned as-is
 * and written to localStorage cache. Seed mocks are last-resort only when
 * the client is unconfigured or the request fails.
 */
export async function fetchEvents(): Promise<{
  data: EventRow[];
  source: ContentSource;
}> {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, date, label, payment_url, image_url, created_at")
      .order("date", { ascending: true });

    if (!error && Array.isArray(data)) {
      writeCachedEvents(data);
      return { data, source: "supabase" };
    }
  }

  const cached = readCachedEvents();
  if (cached.length > 0) {
    return { data: cached, source: "cache" };
  }

  if (!supabase) {
    return { data: FALLBACK_EVENTS, source: "seed" };
  }

  // Client configured but request failed — prefer empty live surface over mock rows
  return { data: [], source: "supabase" };
}

/**
 * Live `plaques` take absolute priority (same policy as events).
 */
export async function fetchPlaques(): Promise<{
  data: PlaqueRow[];
  source: ContentSource;
}> {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("plaques")
      .select("id, title, description, image_url, location, date_placed")
      .order("date_placed", { ascending: false, nullsFirst: false });

    if (!error && Array.isArray(data)) {
      writeCachedPlaques(data);
      return { data, source: "supabase" };
    }
  }

  const cached = readCachedPlaques();
  if (cached.length > 0) {
    return { data: cached, source: "cache" };
  }

  if (!supabase) {
    return { data: FALLBACK_PLAQUES, source: "seed" };
  }

  return { data: [], source: "supabase" };
}

export async function createEvent(
  payload: EventInsert
): Promise<{ data: EventRow | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateEvent(
  id: string,
  payload: EventUpdate
): Promise<{ data: EventRow | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteEvent(
  id: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("events").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function createPlaque(
  payload: PlaqueInsert
): Promise<{ data: PlaqueRow | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("plaques")
    .insert(payload)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updatePlaque(
  id: string,
  payload: PlaqueUpdate
): Promise<{ data: PlaqueRow | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("plaques")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deletePlaque(
  id: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("plaques").delete().eq("id", id);
  return { error: error?.message ?? null };
}
