import { NextResponse } from "next/server";
import {
  canAssignRole,
  isProfileRole,
  requireStaffRequest,
} from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/supabase/database.types";

type InviteBody = {
  email?: string;
  full_name?: string;
  role?: ProfileRole;
};

/**
 * POST /api/admin/stewards
 * Staff (admin | developer): invite via Auth Admin API and upsert profiles.
 * Admins may assign admin|user only; developers may assign any role.
 */
export async function POST(request: Request) {
  const gate = await requireStaffRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: InviteBody;
  try {
    body = (await request.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const role = body.role;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (!isProfileRole(role)) {
    return NextResponse.json(
      { error: "Role clearance must be admin, developer, or user." },
      { status: 400 }
    );
  }

  if (!canAssignRole(gate.profile.role, role)) {
    return NextResponse.json(
      {
        error:
          gate.profile.role === "admin"
            ? "Admins may assign admin or user clearance only."
            : "You cannot assign that role clearance.",
      },
      { status: 403 }
    );
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = origin ? `${origin.replace(/\/$/, "")}/admin` : undefined;

  const { data: invited, error: inviteError } =
    await gate.admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    });

  if (inviteError || !invited.user) {
    const message = inviteError?.message ?? "Invite failed.";
    if (/already|registered|exists/i.test(message)) {
      const { data: listed } = await gate.admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = listed?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );
      if (!existing) {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const { data: profile, error: upsertError } = await gate.admin
        .from("profiles")
        .upsert(
          {
            id: existing.id,
            full_name: fullName,
            role,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("id, updated_at, full_name, role")
        .single();

      if (upsertError || !profile) {
        return NextResponse.json(
          { error: upsertError?.message ?? "Could not update existing steward." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        mode: "updated",
        profile,
        message: "Existing account found — profile clearance updated.",
      });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data: profile, error: upsertError } = await gate.admin
    .from("profiles")
    .upsert(
      {
        id: invited.user.id,
        full_name: fullName,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("id, updated_at, full_name, role")
    .single();

  if (upsertError || !profile) {
    return NextResponse.json(
      {
        error:
          upsertError?.message ??
          "User invited but profile upsert failed. Elevate role manually in SQL.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "invited",
    profile,
    message: "Invite sent. Steward profile registered with requested clearance.",
  });
}

type DeleteBody = {
  id?: string;
};

/**
 * DELETE /api/admin/stewards
 * Staff (admin | developer): permanently remove a steward via Auth Admin API.
 * Body: `{ id: string }`. Cannot delete yourself. Admins cannot remove developers.
 */
export async function DELETE(request: Request) {
  const gate = await requireStaffRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const targetId = body.id?.trim() ?? "";
  if (!targetId) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  if (targetId === gate.userId) {
    return NextResponse.json(
      { error: "You cannot revoke your own account." },
      { status: 400 }
    );
  }

  const { data: targetProfile, error: targetError } = await gate.admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", targetId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }
  if (!targetProfile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // Mirror invite clearance: admins may not touch developer accounts.
  if (
    gate.profile.role === "admin" &&
    targetProfile.role === "developer"
  ) {
    return NextResponse.json(
      { error: "Admins cannot revoke developer accounts." },
      { status: 403 }
    );
  }

  const { error: deleteError } = await gate.admin.auth.admin.deleteUser(targetId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "deleted",
    id: targetId,
    message: `Revoked ${targetProfile.full_name?.trim() || "steward"} — Auth user removed.`,
  });
}

