import { getSupabaseServer } from "../supabase.server";

/**
 * Business Memory System
 *
 * Assembles the full business context from all existing database tables
 * into a single structured object. This is the "working memory" that
 * every AI engine uses to ground its responses in real business data.
 *
 * Design: no new tables. Reads businesses, intelligence_scores,
 * competitors, opportunities, reports, and chat_messages.
 */

export interface BusinessMemory {
  business: {
    id: string;
    name: string;
    url: string;
    industry: string;
    description: string;
    growthGoals: string;
    plan: string;
    auditsUsed: number;
    auditsLimit: number;
    aiProfile: any;
    createdAt: string;
  };
  scores: {
    seo: { score: number; delta: number; issues: any[]; recommendations: any[] };
    aeo: { score: number; delta: number; issues: any[]; recommendations: any[] };
    geo: { score: number; delta: number; issues: any[]; recommendations: any[] };
  };
  scoreHistory: Array<{ type: string; score: number; computedAt: string }>;
  competitors: Array<{
    name: string;
    url: string;
    category: string;
    threatLevel: string;
    contentScore: number;
    trafficTrend: number;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    type: string;
    impact: string;
    difficulty: string;
    revenue: number;
    status: string;
    actionPlan: string;
  }>;
  recentReports: Array<{
    title: string;
    period: string;
    summary: string;
    date: string;
  }>;
  recentChats: Array<{
    role: string;
    content: string;
    createdAt: string;
  }>;
}

export async function loadBusinessMemory(businessId: string): Promise<BusinessMemory> {
  const supabase = getSupabaseServer();

  // 1. Core business profile
  const { data: biz } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!biz) throw new Error("Business not found");

  // 2. Latest intelligence scores (one per type)
  const getLatest = async (type: string) => {
    const { data } = await supabase
      .from("intelligence_scores")
      .select("score, delta, issues, recommendations")
      .eq("business_id", businessId)
      .eq("score_type", type)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || { score: 0, delta: 0, issues: [], recommendations: [] };
  };

  const [seo, aeo, geo] = await Promise.all([
    getLatest("seo"),
    getLatest("aeo"),
    getLatest("geo"),
  ]);

  // 3. Score history (last 10 per type for trend analysis)
  const { data: historyRows } = await supabase
    .from("intelligence_scores")
    .select("score_type, score, computed_at")
    .eq("business_id", businessId)
    .order("computed_at", { ascending: false })
    .limit(30);

  const scoreHistory = (historyRows || []).map((r: any) => ({
    type: r.score_type,
    score: r.score,
    computedAt: r.computed_at,
  }));

  // 4. Competitors
  const { data: comps } = await supabase
    .from("competitors")
    .select("name, url, category, threat_level, content_score, traffic_trend")
    .eq("business_id", businessId);

  const competitors = (comps || []).map((c: any) => ({
    name: c.name,
    url: c.url,
    category: c.category || "General",
    threatLevel: c.threat_level || "Medium",
    contentScore: c.content_score || 0,
    trafficTrend: c.traffic_trend || 0,
  }));

  // 5. Opportunities (all statuses for tracking)
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, title, type, impact, difficulty, revenue, status, action_plan")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(20);

  const opportunities = (opps || []).map((o: any) => ({
    id: o.id,
    title: o.title,
    type: o.type,
    impact: o.impact,
    difficulty: o.difficulty,
    revenue: o.revenue || 0,
    status: o.status,
    actionPlan: o.action_plan || "",
  }));

  // 6. Recent reports (last 5)
  const { data: reps } = await supabase
    .from("reports")
    .select("title, period, summary, report_date")
    .eq("business_id", businessId)
    .order("report_date", { ascending: false })
    .limit(5);

  const recentReports = (reps || []).map((r: any) => ({
    title: r.title,
    period: r.period,
    summary: r.summary || "",
    date: r.report_date,
  }));

  // 7. Recent chat messages (last 10 for conversational continuity)
  const { data: chats } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentChats = (chats || []).reverse().map((c: any) => ({
    role: c.role,
    content: c.content,
    createdAt: c.created_at,
  }));

  return {
    business: {
      id: biz.id,
      name: biz.name,
      url: biz.url,
      industry: biz.industry || "E-commerce",
      description: biz.description || "",
      growthGoals: biz.growth_goals || "",
      plan: biz.plan,
      auditsUsed: biz.audits_used,
      auditsLimit: biz.audits_limit,
      aiProfile: biz.ai_profile || {},
      createdAt: biz.created_at,
    },
    scores: { seo, aeo, geo },
    scoreHistory,
    competitors,
    opportunities,
    recentReports,
    recentChats,
  };
}

/**
 * Compresses business memory into a concise text context for Gemini prompts.
 * Keeps token usage minimal while preserving critical business intelligence.
 */
export function compressMemoryForPrompt(memory: BusinessMemory): string {
  const b = memory.business;
  const s = memory.scores;
  const openOpps = memory.opportunities.filter(o => o.status === "open");
  const doneOpps = memory.opportunities.filter(o => o.status === "done");
  const highThreats = memory.competitors.filter(c => c.threatLevel === "High");

  return `BUSINESS CONTEXT:
Name: ${b.name} | URL: ${b.url} | Industry: ${b.industry}
Description: ${b.description}
Growth Goals: ${b.growthGoals || "Not set"}
Plan: ${b.plan} | Audits: ${b.auditsUsed}/${b.auditsLimit}

CURRENT SCORES:
SEO: ${s.seo.score}/100 (Δ${s.seo.delta >= 0 ? "+" : ""}${s.seo.delta}) | AEO: ${s.aeo.score}/100 (Δ${s.aeo.delta >= 0 ? "+" : ""}${s.aeo.delta}) | GEO: ${s.geo.score}/100 (Δ${s.geo.delta >= 0 ? "+" : ""}${s.geo.delta})

TOP ISSUES: ${[...s.seo.issues.slice(0, 2), ...s.aeo.issues.slice(0, 1), ...s.geo.issues.slice(0, 1)].map((i: any) => i.title).join("; ") || "None"}

COMPETITORS (${memory.competitors.length}): ${memory.competitors.map(c => `${c.name} [${c.threatLevel}]`).join(", ") || "None tracked"}
HIGH THREATS: ${highThreats.map(c => c.name).join(", ") || "None"}

OPPORTUNITIES: ${openOpps.length} open, ${doneOpps.length} completed
TOP 3: ${openOpps.slice(0, 3).map(o => `${o.title} (₹${o.revenue}/mo, ${o.impact} impact)`).join("; ") || "None"}

RECENT REPORTS: ${memory.recentReports.length > 0 ? memory.recentReports[0].title : "None generated"}`;
}
