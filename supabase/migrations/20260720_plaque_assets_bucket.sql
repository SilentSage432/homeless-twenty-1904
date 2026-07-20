-- =============================================================================
-- Homeless Twenty 1904 — plaque-assets storage bucket
-- Migration: 20260720_plaque_assets_bucket.sql
--
-- Public-read bucket for historical plaque photography.
-- Uploads restricted to admin + developer roles (can_manage_content).
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plaque-assets',
  'plaque-assets',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "plaque_assets_public_read" ON storage.objects;
CREATE POLICY "plaque_assets_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'plaque-assets');

DROP POLICY IF EXISTS "plaque_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_staff_insert" ON storage.objects;
CREATE POLICY "plaque_assets_staff_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'plaque-assets'
    AND public.can_manage_content()
  );

DROP POLICY IF EXISTS "plaque_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_staff_update" ON storage.objects;
CREATE POLICY "plaque_assets_staff_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'plaque-assets' AND public.can_manage_content())
  WITH CHECK (bucket_id = 'plaque-assets' AND public.can_manage_content());

DROP POLICY IF EXISTS "plaque_assets_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_staff_delete" ON storage.objects;
CREATE POLICY "plaque_assets_staff_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'plaque-assets' AND public.can_manage_content());
