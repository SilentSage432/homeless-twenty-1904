-- =============================================================================
-- Homeless Twenty 1904 — Optional event imagery
-- Migration: 20260720_events_image_url.sql
--
-- Adds an optional image_url to events. Event images reuse the existing public
-- `plaque-assets` storage bucket (already provisioned with RLS), so no new
-- bucket or storage policies are required.
-- =============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.events.image_url IS
  'Optional public URL for an event image (stored in the plaque-assets bucket).';
