import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  canManageContent,
  type Profile,
  type ProfileRole,
} from "@/lib/supabase/database.types";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

export type StaffSession =
  | { ok: true; userId: string; profile: Profile }
  | { ok: false; reason: "unconfigured" | "unauthenticated" | "forbidden"; role?: ProfileRole | null };

function mapAuthError(error: { message: string } | null): string {
  if (!error?.message) return "Authentication failed. Please try again.";
  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login")) {
    return "Email or password is incorrect.";
  }
  if (msg.includes("email") || msg.includes("password")) {
    return error.message;
  }
  return error.message;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    return { ok: false, message: mapAuthError(error) };
  }

  return { ok: true, userId: data.user.id };
}

export async function signOutSession(): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: true, userId: "" };
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, message: mapAuthError(error) };
  }

  return { ok: true, userId: "" };
}

export async function getSessionUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, updated_at, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getCurrentUserRole(): Promise<ProfileRole | null> {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
}

/**
 * Session route checkpoint for `/admin/dashboard`.
 * Allows only profiles whose role is `admin` or `developer`.
 * Role `user` (or missing profile) → forbidden.
 */
export async function requireStaffSession(): Promise<StaffSession> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "unconfigured" };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const profile = await getCurrentProfile();
  if (!profile || !canManageContent(profile.role)) {
    return {
      ok: false,
      reason: "forbidden",
      role: profile?.role ?? "user",
    };
  }

  return { ok: true, userId, profile };
}

export async function canCurrentUserManageContent(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return canManageContent(role);
}

/** @deprecated Prefer requireStaffSession / canCurrentUserManageContent */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return canCurrentUserManageContent();
}
