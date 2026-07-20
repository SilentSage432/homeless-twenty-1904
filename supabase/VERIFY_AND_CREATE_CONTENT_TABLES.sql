-- =============================================================================
-- Quick verify + create missing content tables
-- Paste into Supabase SQL Editor for project: bsddcwkhkmxdcuimzzgr
-- =============================================================================

-- 1) What tables exist right now?
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2) Create events / plaques if missing (safe to re-run)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date timestamptz NOT NULL,
  label text NOT NULL DEFAULT '',
  payment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plaques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  date_placed date
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaques ENABLE ROW LEVEL SECURITY;

-- Public read (drop/recreate so re-runs are safe)
DROP POLICY IF EXISTS "events_public_read" ON public.events;
CREATE POLICY "events_public_read"
  ON public.events FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "plaques_public_read" ON public.plaques;
CREATE POLICY "plaques_public_read"
  ON public.plaques FOR SELECT TO anon, authenticated
  USING (true);

-- 3) Confirm again
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('events', 'plaques', 'profiles');
