-- =============================================================================
-- Homeless Twenty 1904 — Content revision history
-- Migration: 20260721_content_revisions.sql
--
-- Snapshots the prior state of a site_content_sections row on every save so
-- stewards can review and restore earlier versions. Staff-only (admin/dev).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_slug text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_content_revisions_slug
  ON public.content_revisions (section_slug, created_at DESC);

ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_revisions_staff_all" ON public.content_revisions;
CREATE POLICY "content_revisions_staff_all"
  ON public.content_revisions FOR ALL TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());
