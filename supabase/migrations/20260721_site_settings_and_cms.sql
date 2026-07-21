-- =============================================================================
-- Homeless Twenty 1904 — CMS & Operational Control Suite
-- Migration: 20260721_site_settings_and_cms.sql
--
-- Tables: site_settings (singleton JSON config), site_content_sections, faqs,
--         inquiries, public_documents. Plus a public `lodge-documents` bucket.
-- RLS:    public read for active/published rows; admin+developer read/write.
--         Inquiries are staff-only (public submissions persist via the
--         service-role /api/contact route, which bypasses RLS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- site_settings — single global row of key/JSON configuration
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'global',
  announcement_banner jsonb NOT NULL DEFAULT
    '{"enabled":false,"message":"","link_url":"","type":"info"}'::jsonb,
  lodge_info jsonb NOT NULL DEFAULT
    '{"phone":"","address":"","hours":"","meeting_schedule":"","social_facebook":"","social_instagram":""}'::jsonb,
  hero_config jsonb NOT NULL DEFAULT
    '{"title":"","subtitle":"","button_text":"","button_link":"","bg_image_url":""}'::jsonb,
  feature_flags jsonb NOT NULL DEFAULT
    '{"allow_inquiries":true,"allow_rsvps":true,"show_interactive_map":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT site_settings_singleton CHECK (id = 'global')
);

-- Seed the singleton row + preserve current hero/about copy as defaults.
INSERT INTO public.site_settings (id, hero_config)
VALUES (
  'global',
  '{"title":"Guardians of Western Heritage across Southern & Eastern Idaho","subtitle":"Preserving the rugged frontier history of the Magic Valley — one plaque, one gathering, one story at a time.","button_text":"View Upcoming Events","button_link":"/#events","bg_image_url":""}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- site_content_sections — editable static page blocks keyed by slug
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

INSERT INTO public.site_content_sections (slug, title, content)
VALUES
  (
    'about-lore',
    'Guardians of Magic Valley Lore',
    '<p>Homeless Twenty 1904 is a historical society interested in raising awareness of western heritage in Southern and Eastern Idaho. We focus heavily on preserving Eastern Idaho and Magic Valley history through community engagement, events, and the physical placement of historical markers and plaques that honor our region''s rich past.</p><p>We gather as neighbors and keepers of memory — educators, outdoor wanderers, long-time locals, and anyone who believes a plaque on a quiet roadside can outlast a generation of forgetting.</p>'
  ),
  (
    'president-message',
    'A Word from the President',
    ''
  )
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- faqs — published FAQ entries with manual ordering
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs (display_order ASC);

-- ---------------------------------------------------------------------------
-- inquiries — contact modal submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);

-- ---------------------------------------------------------------------------
-- public_documents — downloadable lodge documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_documents_created_at ON public.public_documents (created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_documents ENABLE ROW LEVEL SECURITY;

-- site_settings: public read; staff full write
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "site_settings_staff_write" ON public.site_settings;
CREATE POLICY "site_settings_staff_write"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());

-- site_content_sections: public read; staff full write
DROP POLICY IF EXISTS "sections_public_read" ON public.site_content_sections;
CREATE POLICY "sections_public_read"
  ON public.site_content_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sections_staff_write" ON public.site_content_sections;
CREATE POLICY "sections_staff_write"
  ON public.site_content_sections FOR ALL TO authenticated
  USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());

-- faqs: public read published rows (staff see all); staff full write
DROP POLICY IF EXISTS "faqs_read" ON public.faqs;
CREATE POLICY "faqs_read"
  ON public.faqs FOR SELECT TO anon, authenticated
  USING (is_published OR public.can_manage_content());
DROP POLICY IF EXISTS "faqs_staff_write" ON public.faqs;
CREATE POLICY "faqs_staff_write"
  ON public.faqs FOR ALL TO authenticated
  USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());

-- inquiries: staff only (public inserts arrive via service-role route)
DROP POLICY IF EXISTS "inquiries_staff_all" ON public.inquiries;
CREATE POLICY "inquiries_staff_all"
  ON public.inquiries FOR ALL TO authenticated
  USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());

-- public_documents: public read; staff full write
DROP POLICY IF EXISTS "documents_public_read" ON public.public_documents;
CREATE POLICY "documents_public_read"
  ON public.public_documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "documents_staff_write" ON public.public_documents;
CREATE POLICY "documents_staff_write"
  ON public.public_documents FOR ALL TO authenticated
  USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());

-- ---------------------------------------------------------------------------
-- Storage: public `lodge-documents` bucket (PDFs, docs). Staff-only writes.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lodge-documents',
  'lodge-documents',
  true,
  20971520,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "lodge_docs_public_read" ON storage.objects;
CREATE POLICY "lodge_docs_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'lodge-documents');

DROP POLICY IF EXISTS "lodge_docs_staff_insert" ON storage.objects;
CREATE POLICY "lodge_docs_staff_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lodge-documents' AND public.can_manage_content());

DROP POLICY IF EXISTS "lodge_docs_staff_update" ON storage.objects;
CREATE POLICY "lodge_docs_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lodge-documents' AND public.can_manage_content())
  WITH CHECK (bucket_id = 'lodge-documents' AND public.can_manage_content());

DROP POLICY IF EXISTS "lodge_docs_staff_delete" ON storage.objects;
CREATE POLICY "lodge_docs_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lodge-documents' AND public.can_manage_content());
