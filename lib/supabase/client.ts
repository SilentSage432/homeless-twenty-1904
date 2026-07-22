import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type HomelessTwentySupabaseClient = SupabaseClient<Database>;

let browserClient: HomelessTwentySupabaseClient | null = null;
let missingEnvLogged = false;

/**
 * Reads credentials exclusively from process.env (populated by Next.js
 * from the project-root `.env.local`). No hardcoded project URLs or keys.
 */
export function readSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (!missingEnvLogged && typeof window !== "undefined") {
      console.warn(
        "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY in root .env.local"
      );
      missingEnvLogged = true;
    }
    return null;
  }

  return { url, anonKey };
}

/**
 * Central browser Supabase client (App Router).
 * Singleton — typed against Database (profiles, events, plaques).
 */
export function getSupabaseBrowserClient(): HomelessTwentySupabaseClient | null {
  const env = readSupabasePublicEnv();
  if (!env) return null;

  if (!browserClient) {
    browserClient = createClient<Database>(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }

  return browserClient;
}

/** True when public Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return readSupabasePublicEnv() !== null;
}
