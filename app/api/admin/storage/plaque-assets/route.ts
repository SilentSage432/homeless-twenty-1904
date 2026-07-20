import { NextResponse } from "next/server";
import { requireDeveloperRequest } from "@/lib/supabase/admin";
import { PLAQUE_ASSETS_BUCKET } from "@/lib/supabase/storage";

/**
 * POST /api/admin/storage/plaque-assets
 * Developer-only verification via storage.from(...).list — not getBucket.
 * Does not create buckets (SQL migration owns creation + RLS).
 */
export async function POST(request: Request) {
  const gate = await requireDeveloperRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { data, error } = await gate.admin.storage
    .from(PLAQUE_ASSETS_BUCKET)
    .list("", { limit: 1 });

  const bucketMissing =
    !!error && /bucket not found|no such bucket/i.test(error.message);

  if (!bucketMissing) {
    return NextResponse.json({
      ok: true,
      mode: "verified",
      bucket: PLAQUE_ASSETS_BUCKET,
      sampled: data?.length ?? 0,
      message: "plaque-assets bucket is Healthy / Configured.",
      note: error?.message ?? null,
    });
  }

  return NextResponse.json(
    {
      error: error.message,
      hint: "Run supabase/migrations/20260720_plaque_assets_bucket.sql in the SQL editor. This endpoint does not create buckets.",
    },
    { status: 404 }
  );
}
