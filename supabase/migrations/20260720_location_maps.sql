-- =============================================================================
-- Homeless Twenty 1904 — Location + Google Maps metadata
-- Migration: 20260720_location_maps.sql
--
-- Adds optional geolocation to events (which also gain a `location` address)
-- and plaques (which already have a `location`). `map_url` stores the Google
-- Maps place/directions URL for one-tap navigation on public cards.
-- =============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS map_url text;

ALTER TABLE public.plaques
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS map_url text;

COMMENT ON COLUMN public.events.map_url IS
  'Google Maps place/directions URL for the event location.';
COMMENT ON COLUMN public.plaques.map_url IS
  'Google Maps place/directions URL for the plaque location.';
