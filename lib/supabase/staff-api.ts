import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Attach the current session JWT for developer-only API routes. */
export async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No active session. Sign in again.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
