import { getSupabaseForUser, getSupabaseServer } from "./supabase.server";
import type { AppUser, UserRole } from "./types";

interface AuthContext {
  user: AppUser;
  businessId: string;
  role: UserRole;
  supabase: ReturnType<typeof getSupabaseForUser>;
}

interface AuthUserOnly {
  user: AppUser;
  supabase: ReturnType<typeof getSupabaseForUser>;
}

/**
 * Read the access token from the request cookie.
 * Returns null if not available.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("sb-access-token") ?? null;
  } catch {
    return null;
  }
}

/**
 * Require an authenticated user. Throws if not authenticated.
 * Returns the authenticated user and a Supabase client scoped to their permissions.
 */
export async function requireAuth(): Promise<AuthUserOnly> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const supabase = getSupabaseForUser(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
    },
    supabase,
  };
}

/**
 * Require an authenticated user with business access.
 * Returns the full auth context including business ID and role.
 */
export async function requireBusinessAccess(): Promise<AuthContext> {
  const { user, supabase } = await requireAuth();

  const { data: membership, error } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error || !membership) {
    throw new Error("Business access required. Please complete onboarding.");
  }

  return {
    user,
    businessId: membership.business_id,
    role: membership.role as UserRole,
    supabase,
  };
}

/**
 * Require a specific role (or higher) for the current user.
 * Role hierarchy: owner > admin > viewer
 */
export async function requireRole(minimumRole: UserRole): Promise<AuthContext> {
  const context = await requireBusinessAccess();
  const hierarchy: Record<UserRole, number> = { viewer: 0, admin: 1, owner: 2 };

  if (hierarchy[context.role] < hierarchy[minimumRole]) {
    throw new Error(`Insufficient permissions. Required role: ${minimumRole}`);
  }

  return context;
}

/**
 * Try to get auth context, returning null if not authenticated.
 * Useful for endpoints that work with or without authentication (dev mode fallbacks).
 */
export async function tryAuth(): Promise<AuthUserOnly | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

/**
 * Try to get business context, returning null if not available.
 */
export async function tryBusinessAccess(): Promise<AuthContext | null> {
  try {
    return await requireBusinessAccess();
  } catch {
    return null;
  }
}
