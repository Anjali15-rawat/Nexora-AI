import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client.
// Used ONLY for auth state management (sign in, sign out, session refresh).
// All data fetching goes through TanStack Start server functions.

let browserClient: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client for browser use.
 * Reads public VITE_ env vars (safe to expose to the client).
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // In development without Supabase configured, return a stub
    // that won't crash the app but will fail gracefully on auth calls
    console.warn(
      "Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
    );
    // Create with placeholder values — auth calls will fail gracefully
    browserClient = createClient(
      url || "https://placeholder.supabase.co",
      anonKey || "placeholder-key",
    );
    return browserClient;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  // Sync session to cookies for SSR support
  browserClient.auth.onAuthStateChange((event, session) => {
    if (typeof window !== "undefined") {
      const isHttps = window.location.protocol === "https:";
      const cookieOptions = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isHttps ? "; Secure" : ""}`;
      if (session) {
        document.cookie = `sb-access-token=${session.access_token}; ${cookieOptions}`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; ${cookieOptions}`;
      } else {
        const expireOptions = "path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        document.cookie = `sb-access-token=; ${expireOptions}`;
        document.cookie = `sb-refresh-token=; ${expireOptions}`;
      }
    }
  });

  return browserClient;
}
