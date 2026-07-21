import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AnnouncementBanner,
  FaqInsert,
  FaqRow,
  FaqUpdate,
  FeatureFlags,
  HeroConfig,
  InquiryRow,
  InquiryStatus,
  LodgeInfo,
  PublicDocument,
  SiteContentSection,
  SiteSettings,
} from "@/lib/supabase/database.types";

export const SITE_SETTINGS_ID = "global";
export const LODGE_DOCUMENTS_BUCKET = "lodge-documents";

export const DEFAULT_ANNOUNCEMENT: AnnouncementBanner = {
  enabled: false,
  message: "",
  link_url: "",
  type: "info",
};

export const DEFAULT_LODGE_INFO: LodgeInfo = {
  phone: "",
  address: "",
  hours: "",
  meeting_schedule: "",
  social_facebook: "",
  social_instagram: "",
};

export const DEFAULT_HERO: HeroConfig = {
  title: "",
  subtitle: "",
  button_text: "",
  button_link: "",
  bg_image_url: "",
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  allow_inquiries: true,
  allow_rsvps: true,
  show_interactive_map: true,
};

export function defaultSiteSettings(): SiteSettings {
  return {
    id: SITE_SETTINGS_ID,
    announcement_banner: DEFAULT_ANNOUNCEMENT,
    lodge_info: DEFAULT_LODGE_INFO,
    hero_config: DEFAULT_HERO,
    feature_flags: DEFAULT_FEATURE_FLAGS,
    updated_at: new Date(0).toISOString(),
    updated_by: null,
  };
}

/** Merge stored JSON over defaults so missing keys never break the UI. */
function normalizeSettings(row: Partial<SiteSettings> | null): SiteSettings {
  const base = defaultSiteSettings();
  if (!row) return base;
  return {
    id: row.id ?? base.id,
    announcement_banner: { ...base.announcement_banner, ...(row.announcement_banner ?? {}) },
    lodge_info: { ...base.lodge_info, ...(row.lodge_info ?? {}) },
    hero_config: { ...base.hero_config, ...(row.hero_config ?? {}) },
    feature_flags: { ...base.feature_flags, ...(row.feature_flags ?? {}) },
    updated_at: row.updated_at ?? base.updated_at,
    updated_by: row.updated_by ?? null,
  };
}

/** Public read of the singleton settings row (works on server + client). */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return defaultSiteSettings();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", SITE_SETTINGS_ID)
    .maybeSingle();

  if (error || !data) return defaultSiteSettings();
  return normalizeSettings(data);
}

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  return (await fetchSiteSettings()).feature_flags;
}

export async function updateSiteSettings(
  patch: {
    announcement_banner?: AnnouncementBanner;
    lodge_info?: LodgeInfo;
    hero_config?: HeroConfig;
    feature_flags?: FeatureFlags;
  },
  userId: string | null
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase
    .from("site_settings")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", SITE_SETTINGS_ID);

  return { error: error?.message ?? null };
}

// --- Content sections --------------------------------------------------------

export async function fetchSections(): Promise<SiteContentSection[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_content_sections")
    .select("*")
    .order("slug", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function fetchSection(
  slug: string
): Promise<SiteContentSection | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_content_sections")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function upsertSection(
  slug: string,
  patch: { title: string; content: string },
  userId: string | null
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("site_content_sections").upsert(
    {
      slug,
      title: patch.title,
      content: patch.content,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    },
    { onConflict: "slug" }
  );
  return { error: error?.message ?? null };
}

// --- FAQs --------------------------------------------------------------------

export async function fetchFaqs(publishedOnly = false): Promise<FaqRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  let query = supabase
    .from("faqs")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (publishedOnly) query = query.eq("is_published", true);
  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export async function createFaq(
  payload: FaqInsert
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("faqs").insert(payload);
  return { error: error?.message ?? null };
}

export async function updateFaq(
  id: string,
  payload: FaqUpdate
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("faqs").update(payload).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteFaq(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// --- Inquiries ---------------------------------------------------------------

export async function fetchInquiries(): Promise<InquiryRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function updateInquiry(
  id: string,
  patch: { status?: InquiryStatus; notes?: string | null }
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("inquiries").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

// --- Public documents --------------------------------------------------------

export async function fetchDocuments(): Promise<PublicDocument[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("public_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function createDocument(payload: {
  title: string;
  category: string;
  file_url: string;
}): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("public_documents").insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteDocument(
  id: string
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("public_documents").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** Upload a document file to the public lodge-documents bucket. */
export async function uploadDocumentFile(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { url: null, error: "Supabase is not configured." };

  const maxBytes = 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { url: null, error: "File must be 20MB or smaller." };
  }

  const safeName =
    file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "document";
  const path = `doc-${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;

  const { error } = await supabase.storage
    .from(LODGE_DOCUMENTS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(LODGE_DOCUMENTS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl ?? null, error: null };
}
