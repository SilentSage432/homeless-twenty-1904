-- =============================================================================
-- Homeless Twenty 1904 — Fresh project schema (RBAC + content)
-- Migration: 20260720_init_homelesstwenty_schema.sql
--
-- Tables: profiles (id, updated_at, full_name, role), events, plaques
-- RLS: public read; write for role IN ('admin', 'developer')
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.profile_role AS ENUM ('developer', 'admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  full_name text,
  role public.profile_role NOT NULL DEFAULT 'user'
);

COMMENT ON TABLE public.profiles IS
  'Auth-linked profile; role gates dashboard + content writes.';

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date timestamptz NOT NULL,
  label text NOT NULL DEFAULT '',
  payment_url text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_date ON public.events (date ASC);

CREATE TABLE public.plaques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  date_placed date
);

CREATE INDEX idx_plaques_date_placed ON public.plaques (date_placed DESC NULLS LAST);

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

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_content() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_staff"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.can_manage_content());

CREATE POLICY "profiles_update_own_role_immutable"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "events_public_read"
  ON public.events FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "plaques_public_read"
  ON public.plaques FOR SELECT TO anon, authenticated
  USING (true);

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
