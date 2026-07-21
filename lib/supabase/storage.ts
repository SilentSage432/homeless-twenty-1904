import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils/imageCompressor";

export const PLAQUE_ASSETS_BUCKET = "plaque-assets";
// Event images reuse the existing public plaque-assets bucket (already
// provisioned with RLS) — a filename prefix keeps them distinguishable.
export const EVENT_ASSETS_BUCKET = "plaque-assets";

export type UploadResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; message: string };

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Upload an image to a public storage bucket and return its public URL.
 * Shared by plaque and event uploaders (both target `plaque-assets`).
 */
async function uploadImageAsset(
  file: File,
  bucket: string,
  prefix: string
): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Please choose an image file." };
  }

  // Scale + re-encode (WebP) client-side before upload to shrink the payload.
  const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.82 });

  const maxBytes = 8 * 1024 * 1024;
  if (compressed.size > maxBytes) {
    return { ok: false, message: "Image must be 8MB or smaller." };
  }

  const safeName = sanitizeFileName(compressed.name) || `${prefix}.webp`;
  const path = `${prefix}-${Date.now()}-${crypto
    .randomUUID()
    .slice(0, 8)}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
    contentType: compressed.type,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  if (!data.publicUrl) {
    return { ok: false, message: "Upload succeeded but no public URL was returned." };
  }

  return { ok: true, publicUrl: data.publicUrl, path };
}

/** Upload a plaque image and return its public URL for `plaques.image_url`. */
export function uploadPlaqueAsset(file: File): Promise<UploadResult> {
  return uploadImageAsset(file, PLAQUE_ASSETS_BUCKET, "plaque");
}

/** Upload an event image and return its public URL for `events.image_url`. */
export function uploadEventAsset(file: File): Promise<UploadResult> {
  return uploadImageAsset(file, EVENT_ASSETS_BUCKET, "event");
}
