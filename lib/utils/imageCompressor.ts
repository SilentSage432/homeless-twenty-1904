/**
 * Lightweight browser image compressor.
 *
 * Scales an image down to a maximum width and re-encodes it (WebP by default)
 * on a canvas before upload, dramatically shrinking payloads sent to Supabase
 * Storage. Animated GIFs and vector/SVG inputs are passed through untouched.
 */

export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
};

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  mimeType: "image/webp",
};

/** Formats that must not be canvas-flattened (animation / vector loss). */
const PASSTHROUGH = new Set(["image/gif", "image/svg+xml"]);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = url;
  });
}

function swapExtension(name: string, mimeType: string): string {
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}.${ext}`;
}

/**
 * Returns a compressed File, or the original file if compression is
 * unnecessary or unsupported (never throws).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  if (
    typeof document === "undefined" ||
    !file.type.startsWith("image/") ||
    PASSTHROUGH.has(file.type)
  ) {
    return file;
  }

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const img = await loadImage(objectUrl);

    const { width, height } = img;
    if (!width || !height) return file;

    const scale = Math.min(1, opts.maxWidth / width, opts.maxHeight / height);
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), opts.mimeType, opts.quality)
    );
    if (!blob) return file;

    // Keep the original if compression didn't actually help.
    if (blob.size >= file.size && scale === 1) return file;

    return new File([blob], swapExtension(file.name, opts.mimeType), {
      type: opts.mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
