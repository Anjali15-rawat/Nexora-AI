import "./env-loader.server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import process from "node:process";

// Server-only Supabase client.
// Uses the SERVICE ROLE key for admin operations (bypasses RLS).
// For user-scoped queries, use the anon key + user's JWT instead.

let serverClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured for server-side use.
 *
 * ⚠️ This uses the service role key — it bypasses Row Level Security.
 * Use this only for admin operations (creating businesses on signup, etc.).
 * For user-scoped data access, use `getSupabaseForUser()` instead.
 */
export function getSupabaseServer(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  const isProd = process.env.NODE_ENV === "production" || process.env.VITE_USER_NODE_ENV === "production";
  if (isProd && !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in production environments to bypass Row Level Security.");
  }

  // Prefer service role key; fall back to anon key for development
  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in your environment.",
    );
  }

  // Instrumentation for client configuration check
  console.log(`[Supabase Runtime]
SUPABASE_URL loaded: ${!!url}
SUPABASE_SERVICE_ROLE_KEY loaded: ${!!serviceKey}
SUPABASE_ANON_KEY loaded: ${!!anonKey}
Selected key:
${serviceKey ? "SERVICE_ROLE" : "ANON"}`);

  if (!serviceKey) {
    console.error(`ERROR:
SUPABASE_SERVICE_ROLE_KEY is NOT loaded.
Admin client cannot bypass RLS.`);
  }

  serverClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

/**
 * Returns a Supabase client scoped to a specific user's session.
 * This respects RLS policies — the user can only access their own data.
 *
 * @param accessToken - The user's JWT access token from their session
 */
export function getSupabaseForUser(accessToken: string): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.",
    );
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
