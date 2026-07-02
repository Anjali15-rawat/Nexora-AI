import { createServerFn } from "@tanstack/react-start";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  formatZodErrors,
} from "../validation";
import { checkRateLimit, RATE_LIMITS, getClientIdentifier, RATE_LIMIT_ERROR } from "../security.server";
import { getSupabaseServer, getSupabaseForUser } from "../supabase.server";

// ─── Sign Up ─────────────────────────────────────────────────
export const signUp = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const clientIp = await getClientIdentifier();
    const rateLimit = checkRateLimit({
      key: `signup:${clientIp}`,
      ...RATE_LIMITS.signup,
    });
    if (!rateLimit.allowed) {
      return { success: false as const, error: RATE_LIMIT_ERROR };
    }

    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    if (!url || url.includes("placeholder")) {
      return {
        success: true as const,
        user: { id: "dev-user", email: data.email },
        businessId: "dev-biz",
      };
    }

    const supabase = getSupabaseServer();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { success: false as const, error: authError.message };
    }

    if (!authData.user) {
      return { success: false as const, error: "Failed to create user" };
    }

    // 2. Create business record
    const businessName = data.site ? data.name + "'s Business" : data.name;
    const businessUrl = data.site || "https://example.com";
    
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        url: businessUrl,
      })
      .select("id")
      .single();

    if (bizError) {
      return { success: false as const, error: bizError.message };
    }

    // 3. Link user to business
    const { error: memberError } = await supabase
      .from("business_members")
      .insert({
        business_id: business.id,
        user_id: authData.user.id,
        role: "owner",
      });

    if (memberError) {
      return { success: false as const, error: memberError.message };
    }

    return {
      success: true as const,
      user: { id: authData.user.id, email: authData.user.email },
      businessId: business.id,
    };
  });

// ─── Sign In ─────────────────────────────────────────────────
export const signIn = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const clientIp = await getClientIdentifier();
    const rateLimit = checkRateLimit({
      key: `login:${clientIp}`,
      ...RATE_LIMITS.login,
    });
    if (!rateLimit.allowed) {
      return { success: false as const, error: RATE_LIMIT_ERROR };
    }

    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    if (!url || url.includes("placeholder")) {
      return {
        success: true as const,
        session: { accessToken: "dev-token", refreshToken: "dev-token", expiresAt: Date.now() + 86400000 },
        user: { id: "dev-user", email: data.email },
      };
    }

    const supabase = getSupabaseServer();

    const { data: authData, error } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return {
      success: true as const,
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at,
      },
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    };
  });

// ─── Sign Out ────────────────────────────────────────────────
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
});

// ─── Forgot Password ────────────────────────────────────────
export const forgotPassword = createServerFn({ method: "POST" })
  .validator(forgotPasswordSchema)
  .handler(async ({ data }) => {
    const clientIp = await getClientIdentifier();
    const rateLimit = checkRateLimit({
      key: `reset:${clientIp}`,
      ...RATE_LIMITS.passwordReset,
    });
    if (!rateLimit.allowed) {
      return { success: false as const, error: RATE_LIMIT_ERROR };
    }

    const supabase = getSupabaseServer();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.VITE_APP_URL || "http://localhost:3000"}/login`,
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    // Always return success to prevent email enumeration
    return { success: true as const };
  });

// ─── Get Current Session ────────────────────────────────────
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    if (!url || url.includes("placeholder")) {
      return {
        authenticated: true as const,
        user: { id: "dev-user", email: "demo@example.com", name: "Demo User" },
        business: {
          id: "dev-biz",
          name: "Demo Store",
          url: "https://demo.com",
          plan: "pro",
          auditsUsed: 2,
          auditsLimit: 10,
        },
        role: "owner",
      };
    }

    let accessToken: string | null = null;
    try {
      const { getCookie, getRequestHeaders } = await import("@tanstack/react-start/server");
      accessToken = getCookie("sb-access-token") ?? null;
      const headers = getRequestHeaders();
      console.log(`[getSession] sb-access-token cookie found: ${!!accessToken}, referer: ${headers.get("referer")}`);
    } catch (e) {
      console.warn("Failed to read cookie from request context", e);
    }

    if (!accessToken) {
      console.log("[getSession] Returning authenticated: false (no access token cookie)");
      return { authenticated: false as const };
    }

    const supabase = getSupabaseForUser(accessToken);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.log(`[getSession] supabase.auth.getUser() failed: ${error?.message || "No user found"}`);
      return { authenticated: false as const };
    }

    console.log(`[getSession] User authenticated successfully: ${user.email}`);

    // Fetch the user's business
    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, role, businesses(id, name, url, plan, audits_used, audits_limit)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    // Supabase join returns businesses as unknown — safely extract
    const biz = membership?.businesses as unknown as
      | { id: string; name: string; url: string; plan: string; audits_used: number; audits_limit: number }
      | null
      | undefined;

    return {
      authenticated: true as const,
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
      },
      business: biz
        ? {
            id: biz.id,
            name: biz.name,
            url: biz.url,
            plan: biz.plan,
            auditsUsed: biz.audits_used,
            auditsLimit: biz.audits_limit,
          }
        : null,
      role: membership?.role ?? null,
    };
  },
);
