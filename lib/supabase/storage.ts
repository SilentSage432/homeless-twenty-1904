import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const PLAQUE_ASSETS_BUCKET = "plaque-assets";

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
 * Upload a plaque image to the public `plaque-assets` storage bucket
 * and return its public URL for `plaques.image_url`.
 */
export async function uploadPlaqueAsset(file: File): Promise<UploadResult> {
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

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, message: "Image must be 8MB or smaller." };
  }

  const safeName = sanitizeFileName(file.name) || "plaque.jpg";
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;

  const { error } = await supabase.storage
    .from(PLAQUE_ASSETS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { data } = supabase.storage
    .from(PLAQUE_ASSETS_BUCKET)
    .getPublicUrl(path);

  if (!data.publicUrl) {
    return { ok: false, message: "Upload succeeded but no public URL was returned." };
  }

  return { ok: true, publicUrl: data.publicUrl, path };
}
