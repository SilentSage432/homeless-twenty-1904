import { NextResponse } from "next/server";
import { requireDeveloperRequest } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 20000;

/**
 * POST /api/admin/query — emergency SQL executor.
 *
 * Developer clearance required (JWT verified server-side) and runs via the
 * service-role client, which is the only role granted EXECUTE on
 * `admin_exec_sql`. The anon/browser client can never reach this function.
 */
export async function POST(request: Request) {
  const gate = await requireDeveloperRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json(
      { error: "Provide a SQL statement to execute." },
      { status: 400 }
    );
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query exceeds ${MAX_QUERY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const { data, error } = await gate.admin.rpc("admin_exec_sql", { query });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: /function .*admin_exec_sql/i.test(error.message)
          ? "Apply supabase/migrations/20260720_admin_exec_sql.sql in the SQL editor."
          : undefined,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, result: data });
}
