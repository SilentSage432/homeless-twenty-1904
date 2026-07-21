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

/**
 * Best-effort on-demand revalidation of public pages after a CMS save.
 * Never throws — a failed revalidation should not block the editor.
 */
export async function requestRevalidate(
  paths: string[] = ["/", "/about", "/plaques"]
): Promise<void> {
  try {
    await authorizedFetch("/api/admin/revalidate", {
      method: "POST",
      body: JSON.stringify({ paths }),
    });
  } catch {
    // Ignore — ISR will still refresh on its own interval.
  }
}
