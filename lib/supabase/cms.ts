import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AnnouncementBanner,
  ContentRevision,
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

const DEFAULT_ANNOUNCEMENT: AnnouncementBanner = {
  enabled: false,
  message: "",
  link_url: "",
  type: "info",
};

const DEFAULT_LODGE_INFO: LodgeInfo = {
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

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
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

export type ContentSectionSlug =
  | "about_hero"
  | "about_mission"
  | "about_history"
  | "home_intro"
  | "home_heritage_callout"
  | "events_intro"
  | "contact_intro"
  | "about-lore"
  | "president-message";

export type ContentPageGroup =
  | "about"
  | "homepage"
  | "events_contact"
  | "legacy";

export type ContentSectionDefault = {
  slug: ContentSectionSlug;
  title: string;
  content: string;
  label: string;
  group: ContentPageGroup;
  /** Public paths to revalidate when this section is saved. */
  revalidatePaths: string[];
};

/**
 * Canonical catalog of editable page blocks. Ownership lives here — public
 * pages and the Content Manager both compose from these defaults.
 */
export const CONTENT_SECTION_DEFAULTS: ContentSectionDefault[] = [
  {
    slug: "about_hero",
    label: "About · Hero",
    group: "about",
    title: "About Homeless Twenty 1904",
    content:
      "Guardians of Magic Valley lore and western heritage across Southern and Eastern Idaho.",
    revalidatePaths: ["/about"],
  },
  {
    slug: "about_mission",
    label: "About · Mission",
    group: "about",
    title: "Guardians of Magic Valley Lore",
    content:
      "Homeless Twenty 1904 is a historical society interested in raising awareness of western heritage in Southern and Eastern Idaho. We focus heavily on preserving Eastern Idaho and Magic Valley history through community engagement, events, and the physical placement of historical markers and plaques that honor our region's rich past.\n\nWe gather as neighbors and keepers of memory — educators, outdoor wanderers, long-time locals, and anyone who believes a plaque on a quiet roadside can outlast a generation of forgetting.",
    revalidatePaths: ["/", "/about"],
  },
  {
    slug: "about_history",
    label: "About · History",
    group: "about",
    title: "Our History",
    content:
      "From early trail markers to present-day commemorations, the lodge preserves stories that shaped the Magic Valley — and invites every generation to keep the record alive.",
    revalidatePaths: ["/about"],
  },
  {
    slug: "home_intro",
    label: "Homepage · Intro",
    group: "homepage",
    title: "Welcome",
    content:
      "Homeless Twenty 1904 preserves western heritage across Southern and Eastern Idaho — through plaques, gatherings, and the stories we refuse to forget.",
    revalidatePaths: ["/"],
  },
  {
    slug: "home_heritage_callout",
    label: "Homepage · Heritage callout",
    group: "homepage",
    title: "Homeless Twenty 1904",
    content: "A region that remembers its trails will never lose its way.",
    revalidatePaths: ["/"],
  },
  {
    slug: "events_intro",
    label: "Events · Intro",
    group: "events_contact",
    title: "Upcoming Events",
    content:
      "Join us for dinners, trail markers, and fellowship across the Magic Valley. Pre-pay when ready — secure payment links appear when each event opens.",
    revalidatePaths: ["/", "/events"],
  },
  {
    slug: "contact_intro",
    label: "Contact · Intro",
    group: "events_contact",
    title: "Contact the Lodge",
    content:
      "Questions about plaques, events, membership, or local history? Send a message to lodge leadership — we read every note.",
    revalidatePaths: ["/contact"],
  },
  {
    slug: "president-message",
    label: "About · President's message",
    group: "about",
    title: "A Word from the President",
    content: "",
    revalidatePaths: ["/about"],
  },
  {
    slug: "about-lore",
    label: "About · Lodge lore (legacy)",
    group: "legacy",
    title: "Guardians of Magic Valley Lore",
    content:
      "Homeless Twenty 1904 is a historical society interested in raising awareness of western heritage in Southern and Eastern Idaho. We focus heavily on preserving Eastern Idaho and Magic Valley history through community engagement, events, and the physical placement of historical markers and plaques that honor our region's rich past.\n\nWe gather as neighbors and keepers of memory — educators, outdoor wanderers, long-time locals, and anyone who believes a plaque on a quiet roadside can outlast a generation of forgetting.",
    revalidatePaths: ["/", "/about"],
  },
];

export function getContentSectionDefault(
  slug: string
): ContentSectionDefault | undefined {
  return CONTENT_SECTION_DEFAULTS.find((d) => d.slug === slug);
}

export type ResolvedContentSection = {
  slug: string;
  title: string;
  content: string;
  /** True when non-empty content came from the database. */
  fromDb: boolean;
};

/**
 * Public helper: return database text when present, otherwise catalog/passed
 * fallback. Never throws — pages always receive renderable copy.
 */
export async function getContentSection(
  slug: string,
  fallback?: { title?: string; content?: string }
): Promise<ResolvedContentSection> {
  const catalog = getContentSectionDefault(slug);
  const fbTitle = fallback?.title?.trim() || catalog?.title || "";
  const fbContent = fallback?.content ?? catalog?.content ?? "";

  try {
    const row = await fetchSection(slug);
    const dbContent = row?.content?.trim() ?? "";
    if (dbContent) {
      return {
        slug,
        title: row?.title?.trim() || fbTitle,
        content: dbContent,
        fromDb: true,
      };
    }
    // Prefer legacy about-lore when about_mission has not been seeded yet.
    if (slug === "about_mission") {
      const legacy = await fetchSection("about-lore");
      const legacyContent = legacy?.content?.trim() ?? "";
      if (legacyContent) {
        return {
          slug,
          title: legacy?.title?.trim() || fbTitle,
          content: legacyContent,
          fromDb: true,
        };
      }
    }
  } catch {
    // Fall through to defaults.
  }

  return { slug, title: fbTitle, content: fbContent, fromDb: false };
}

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

/**
 * Merge DB rows with the catalog so the editor always shows every editable
 * block — even before a steward has saved it for the first time.
 */
export async function fetchSectionsForEditor(): Promise<
  Array<SiteContentSection & { label: string; group: ContentPageGroup }>
> {
  const rows = await fetchSections();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const catalogued = CONTENT_SECTION_DEFAULTS.filter(
    (d) => d.group !== "legacy"
  ).map((d) => {
    const row = bySlug.get(d.slug);
    bySlug.delete(d.slug);
    return {
      id: row?.id ?? `draft-${d.slug}`,
      slug: d.slug,
      title: row?.title ?? d.title,
      content: row?.content ?? d.content,
      updated_at: row?.updated_at ?? new Date(0).toISOString(),
      updated_by: row?.updated_by ?? null,
      label: d.label,
      group: d.group,
    };
  });

  // Surface any unexpected DB-only rows (e.g. legacy about-lore) at the end.
  const extras = Array.from(bySlug.values()).map((row) => {
    const d = getContentSectionDefault(row.slug);
    return {
      ...row,
      label: d?.label ?? row.slug,
      group: d?.group ?? ("legacy" as ContentPageGroup),
    };
  });

  return [...catalogued, ...extras];
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

  // Snapshot the prior state into revision history before overwriting.
  const { data: existing } = await supabase
    .from("site_content_sections")
    .select("content")
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.content) {
    await supabase.from("content_revisions").insert({
      section_slug: slug,
      content: existing.content,
      created_by: userId,
    });
  }

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

/** Revision snapshots for a section, newest first. */
export async function fetchRevisions(
  slug: string
): Promise<ContentRevision[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("content_revisions")
    .select("*")
    .eq("section_slug", slug)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data;
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

/** Count of inquiries still in the `new` state (staff-only via RLS). */
export async function fetchNewInquiryCount(): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error || count == null) return 0;
  return count;
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
