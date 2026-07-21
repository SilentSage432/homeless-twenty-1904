import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaffRequest } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Only public, CMS-driven routes may be revalidated on demand.
const ALLOWED_PATHS = new Set(["/", "/about", "/plaques", "/events"]);
const DEFAULT_PATHS = ["/", "/about", "/plaques"];

/**
 * POST /api/admin/revalidate — staff-gated on-demand ISR revalidation.
 * Called after CMS saves so public pages reflect edits immediately.
 */
export async function POST(request: Request) {
  const gate = await requireStaffRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: { paths?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const requested = Array.isArray(body.paths)
    ? body.paths.filter(
        (p): p is string => typeof p === "string" && ALLOWED_PATHS.has(p)
      )
    : DEFAULT_PATHS;

  const paths = requested.length > 0 ? requested : DEFAULT_PATHS;
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, revalidated: paths });
}
