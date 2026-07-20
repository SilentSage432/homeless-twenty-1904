-- =============================================================================
-- Homeless Twenty 1904 — RBAC upgrade (is_admin → role)
-- Migration: 20260720_rbac_profiles_role.sql
--
-- Run after the original boolean schema if already applied.
-- Fresh projects that used the updated init migration can skip this file.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'profile_role'
  ) THEN
    CREATE TYPE public.profile_role AS ENUM ('developer', 'admin', 'user');
  END IF;
END $$;

-- Add role column if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.profile_role;

-- Backfill from legacy is_admin when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin'
  ) THEN
    UPDATE public.profiles
    SET role = CASE
      WHEN is_admin IS TRUE THEN 'admin'::public.profile_role
      ELSE 'user'::public.profile_role
    END
    WHERE role IS NULL;

    ALTER TABLE public.profiles DROP COLUMN is_admin;
  END IF;
END $$;

UPDATE public.profiles
SET role = 'user'::public.profile_role
WHERE role IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user'::public.profile_role;

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.profile_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'user'::public.profile_role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_profile_role() IN (
    'admin'::public.profile_role,
    'developer'::public.profile_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_content();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Replace legacy policies with RBAC staff policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_non_admin_flag" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_role_immutable" ON public.profiles;

CREATE POLICY "profiles_select_own_or_staff"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.can_manage_content());

CREATE POLICY "profiles_update_own_role_immutable"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
DROP POLICY IF EXISTS "events_staff_insert" ON public.events;
DROP POLICY IF EXISTS "events_staff_update" ON public.events;
DROP POLICY IF EXISTS "events_staff_delete" ON public.events;

CREATE POLICY "events_staff_insert"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_content());

CREATE POLICY "events_staff_update"
  ON public.events FOR UPDATE TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

CREATE POLICY "events_staff_delete"
  ON public.events FOR DELETE TO authenticated
  USING (public.can_manage_content());

DROP POLICY IF EXISTS "plaques_admin_insert" ON public.plaques;
DROP POLICY IF EXISTS "plaques_admin_update" ON public.plaques;
DROP POLICY IF EXISTS "plaques_admin_delete" ON public.plaques;
DROP POLICY IF EXISTS "plaques_staff_insert" ON public.plaques;
DROP POLICY IF EXISTS "plaques_staff_update" ON public.plaques;
DROP POLICY IF EXISTS "plaques_staff_delete" ON public.plaques;

CREATE POLICY "plaques_staff_insert"
  ON public.plaques FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_content());

CREATE POLICY "plaques_staff_update"
  ON public.plaques FOR UPDATE TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

CREATE POLICY "plaques_staff_delete"
  ON public.plaques FOR DELETE TO authenticated
  USING (public.can_manage_content());

-- Storage: admin + developer write
DROP POLICY IF EXISTS "plaque_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "plaque_assets_staff_delete" ON storage.objects;

CREATE POLICY "plaque_assets_staff_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'plaque-assets' AND public.can_manage_content());

CREATE POLICY "plaque_assets_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'plaque-assets' AND public.can_manage_content())
  WITH CHECK (bucket_id = 'plaque-assets' AND public.can_manage_content());

CREATE POLICY "plaque_assets_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'plaque-assets' AND public.can_manage_content());
