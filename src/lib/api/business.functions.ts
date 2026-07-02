import { createServerFn } from "@tanstack/react-start";
import {
  analyzeBusinessSchema,
  updateBusinessSchema,
  addCompetitorSchema,
} from "../validation";
import { requireAuth, requireBusinessAccess, tryAuth } from "../auth-utils.server";
import { getSupabaseServer } from "../supabase.server";
import { analyzeBusinessUrl } from "../engines/business-understanding.server";

// ─── Analyze Business URL ────────────────────────────────────
export const analyzeBusiness = createServerFn({ method: "POST" })
  .validator(analyzeBusinessSchema)
  .handler(async ({ data }) => {
    // 1. Run AI analysis
    const profile = await analyzeBusinessUrl(data.url);

    // 2. Try to get authenticated user
    const auth = await tryAuth();

    // If no real user, return the profile with a mock ID for demo purposes
    if (!auth) {
      return {
        success: true as const,
        businessId: "dev-business-id",
        profile,
      };
    }

    const { user } = auth;

    // 3. Database operations
    // Note: We use the admin server client (getSupabaseServer) because the user doesn't
    // belong to the business yet, so their own RLS policy would prevent them from inserting.
    const adminSupabase = getSupabaseServer();

    // Insert business
    const { data: business, error: bizError } = await adminSupabase
      .from("businesses")
      .insert({
        name: profile.name,
        url: data.url,
        industry: profile.industry,
        description: profile.description,
        ai_profile: profile as any,
        growth_goals: profile.suggestedGoals.join("\n"),
        plan: "free",
        audits_used: 0,
        audits_limit: 5,
      })
      .select("id")
      .single();

    if (bizError) {
      return { success: false as const, error: bizError.message };
    }

    // Link user to business
    const { error: memberError } = await adminSupabase
      .from("business_members")
      .insert({
        business_id: business.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      return { success: false as const, error: memberError.message };
    }

    return {
      success: true as const,
      businessId: business.id,
      profile,
    };
  });

// ─── Update Business Profile ─────────────────────────────────
export const updateBusinessProfile = createServerFn({ method: "POST" })
  .validator(updateBusinessSchema)
  .handler(async ({ data }) => {
    const { supabase, businessId } = await requireBusinessAccess();

    const { error } = await supabase
      .from("businesses")
      .update({
        name: data.name,
        url: data.url,
        industry: data.industry,
        growth_goals: data.growthGoals,
      })
      .eq("id", businessId);

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const };
  });

// ─── Get Business Profile ────────────────────────────────────
export const getBusinessProfile = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabase } = await requireBusinessAccess();
    
    const { data: membership, error: memError } = await supabase
      .from("business_members")
      .select("businesses(*)")
      .limit(1)
      .single();

    if (memError || !membership) {
      return null;
    }

    const biz = membership.businesses as any;
    return {
      id: biz.id,
      name: biz.name,
      url: biz.url,
      industry: biz.industry,
      description: biz.description,
      growthGoals: biz.growth_goals,
      plan: biz.plan,
      auditsUsed: biz.audits_used,
      auditsLimit: biz.audits_limit,
    };
  },
);

// ─── Add Competitor ──────────────────────────────────────────
export const addCompetitor = createServerFn({ method: "POST" })
  .validator(addCompetitorSchema)
  .handler(async ({ data }) => {
    const { supabase, businessId } = await requireBusinessAccess();

    const { error } = await supabase.from("competitors").insert({
      business_id: businessId,
      name: data.name,
      url: data.url,
      threat_level: "Medium",
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const };
  });
