import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, ProfileRole } from "@/lib/supabase/database.types";
import {
  canManageContent,
  isDeveloperRole,
} from "@/lib/supabase/database.types";

export type HomelessTwentyAdminClient = SupabaseClient<Database>;

export {
  canAssignRole,
  assignableRolesFor,
} from "@/lib/supabase/database.types";

export type StaffGate =
  | { ok: true; userId: string; profile: Profile; admin: HomelessTwentyAdminClient }
  | { ok: false; status: number; message: string };

/**
 * Server-only Supabase client with the service role key.
 * Never import this module from client components.
 */
export function getSupabaseAdminClient(): HomelessTwentyAdminClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function resolveStaffGate(request: Request): Promise<StaffGate> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      message:
        "Server admin client is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    };
  }

  const token = bearerToken(request);
  if (!token) {
    return { ok: false, status: 401, message: "Missing bearer token." };
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return { ok: false, status: 401, message: "Invalid or expired session." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, updated_at, full_name, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, status: 403, message: "Profile not found." };
  }

  if (!canManageContent(profile.role)) {
    return {
      ok: false,
      status: 403,
      message: "Admin or developer clearance required for this operation.",
    };
  }

  return { ok: true, userId: authData.user.id, profile, admin };
}

/** Verifies JWT and requires admin or developer. */
export async function requireStaffRequest(
  request: Request
): Promise<StaffGate> {
  return resolveStaffGate(request);
}

/**
 * Verifies JWT and requires developer.
 * Prefer requireStaffRequest for personnel invites.
 */
export async function requireDeveloperRequest(
  request: Request
): Promise<StaffGate> {
  const gate = await resolveStaffGate(request);
  if (!gate.ok) return gate;

  if (!isDeveloperRole(gate.profile.role)) {
    return {
      ok: false,
      status: 403,
      message: "Developer clearance required for this operation.",
    };
  }

  return gate;
}

export function isProfileRole(value: unknown): value is ProfileRole {
  return value === "developer" || value === "admin" || value === "user";
}
