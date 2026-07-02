import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer, getSupabaseForUser } from "../supabase.server";
import { discoverCompetitors } from "../engines/competitor-discovery.server";
import { generateOpportunities } from "../engines/opportunity-engine.server";
import { calculateGrowthScore } from "../engines/growth-score.server";
import { generateExecutiveBriefing } from "../engines/executive-briefing.server";
import { processVoiceQuery } from "../engines/voice-agent.server";
import { analyzeCustomerVoice } from "../engines/customer-voice.server";
import { analyzeTrends } from "../engines/trend-radar.server";
import { runDailyAutomation } from "../engines/automation-pipeline.server";
import { loadBusinessMemory } from "../engines/business-memory.server";
import { generateDailySummary, generateRecommendations } from "../engines/recommendation-engine.server";

// Helper to get access token from cookies
async function getToken(): Promise<string | null> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("sb-access-token") ?? null;
  } catch {
    return null;
  }
}

export const getDailySummary = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  if (!token || token === "dev-token") {
    return {
      healthStatus: "Excellent",
      topOpportunity: "Implement structured data for better search presence.",
      biggestRisk: "Competitors are gaining traffic share.",
      competitorActivity: "Monitoring high threat competitors.",
      customerInsights: "Sentiment is generally positive but lacks recent reviews.",
      seoStatus: "Current SEO Score is 84/100.",
      recommendedNextAction: "Review Opportunities tab for prioritized tasks."
    };
  }
  try {
    const supabase = getSupabaseForUser(token);
    const { data: membership } = await supabase.from("business_members").select("business_id").limit(1).single();
    if (!membership) throw new Error("No business");
    const memory = await loadBusinessMemory(membership.business_id);
    return await generateDailySummary(memory);
  } catch (e) {
    return {
      healthStatus: "Good",
      topOpportunity: "Review opportunities list.",
      biggestRisk: "None currently flagged.",
      competitorActivity: "Monitoring in progress.",
      customerInsights: "Stable.",
      seoStatus: "Scores loading...",
      recommendedNextAction: "Check back later."
    };
  }
});

// ─── Get Executive Briefing & Dashboard Data ─────────────────
export const getGrowthDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();

    if (!token || token === "dev-token") {
      // Fallback for dev mode
      const devBriefing = {
        text: `Good morning, team Northwind Apparel.

Here is your growth briefing for today:
Your e-commerce visibility is currently indexed at a Growth Score of 75/100. We recommend addressing product schema validation on your top collection pages to offset search traffic capture from your closest competitor, Veja.

Key Highlights:
- **Growth Score**: 75/100
- **Top Opportunity**: Capture AI overview for 'eco-friendly shoes' (Estimated +₹28,500/month)
- **Competitive Focus**: Monitoring Veja
- **Recommended Action**: Add structured JSON-LD schema to product templates.
`,
        summary: {
          growthScore: 75,
          topOpportunity: "Capture AI overview for 'eco-friendly shoes'",
          potentialRevenue: "₹28,500/month",
          biggestThreat: "Veja",
          recommendedAction: "Add structured JSON-LD schema to product templates.",
          estimatedBusinessImpact: "+₹28,500/month growth potential",
        },
      };

      return {
        growthScore: 75,
        breakdown: [
          { label: "SEO Visibility (25%)", value: 84 },
          { label: "AEO Readiness (20%)", value: 68 },
          { label: "GEO Citations (20%)", value: 62 },
          { label: "Competitor Position (15%)", value: 80 },
          { label: "Opportunity Capture (20%)", value: 80 },
        ],
        explanation: "Good overall health with clear optimization fields. Focus on AEO FAQ schema implementation.",
        briefing: devBriefing,
        revenueImpact: {
          gain: 184500,
          loss: 42300,
        },
        healthMetrics: [
          { label: "SEO Score", value: "84%", delta: 2, hint: "Healthy" },
          { label: "AEO Score", value: "68%", delta: -3, hint: "Needs work" },
          { label: "GEO Score", value: "62%", delta: 5, hint: "Needs work" },
          { label: "Competitors", value: "4 active", delta: 0, hint: "Monitoring" },
          { label: "Customer Voice", value: "84%", delta: 3.5, hint: "Strong" },
          { label: "Revenue Engine", value: "₹184.5k", delta: 8.9, hint: "Gaining" },
        ],
      };
    }

    const supabase = getSupabaseForUser(token);

    // Fetch user business details
    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(*)")
      .limit(1)
      .single();

    if (!membership) {
      throw new Error("Business profile not found");
    }

    const biz = membership.businesses as any;

    // Fetch latest intelligence scores for SEO, AEO, GEO
    const getLatestScore = async (type: string) => {
      const { data } = await supabase
        .from("intelligence_scores")
        .select("score, issues, recommendations")
        .eq("score_type", type)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || { score: 70, issues: [], recommendations: [] };
    };

    const [seo, aeo, geo] = await Promise.all([
      getLatestScore("seo"),
      getLatestScore("aeo"),
      getLatestScore("geo"),
    ]);

    // Fetch competitors
    const { data: dbCompetitors } = await supabase
      .from("competitors")
      .select("*")
      .eq("business_id", biz.id);

    const competitorsList = dbCompetitors || [];

    // Trigger competitor discovery if database has none
    let finalCompetitors = competitorsList;
    if (competitorsList.length === 0) {
      const discovery = await discoverCompetitors({
        businessId: biz.id,
        name: biz.name,
        url: biz.url,
        industry: biz.industry || "E-commerce retailer",
        description: biz.description || "",
        categories: biz.ai_profile?.categories || ["Apparel"],
        targetAudience: biz.ai_profile?.targetAudience || "General buyers",
      });
      finalCompetitors = discovery.competitors;
    }

    // Fetch opportunities
    const { data: dbOpps } = await supabase
      .from("opportunities")
      .select("*")
      .eq("business_id", biz.id)
      .eq("status", "open");

    let finalOpps = dbOpps || [];
    if (finalOpps.length === 0) {
      const allIssues = [
        ...(seo.issues as any[] || []),
        ...(aeo.issues as any[] || []),
        ...(geo.issues as any[] || []),
      ];
      const allRecs = [
        ...(seo.recommendations as any[] || []),
        ...(aeo.recommendations as any[] || []),
        ...(geo.recommendations as any[] || []),
      ];

      const opGen = await generateOpportunities({
        businessId: biz.id,
        businessName: biz.name,
        businessUrl: biz.url,
        industry: biz.industry || "E-commerce retailer",
        description: biz.description || "",
        seoScore: seo.score,
        aeoScore: aeo.score,
        geoScore: geo.score,
        seoIssues: allIssues,
        aeoIssues: allRecs,
        geoIssues: [],
        competitors: finalCompetitors,
      });
      finalOpps = opGen.opportunities.map((o, idx) => ({
        id: `gen-${idx}`,
        title: o.title,
        type: o.category,
        impact: o.estimatedVisibilityImpact,
        difficulty: o.difficulty,
        revenue: o.revenue,
        action_plan: o.recommendedAction,
      }));
    }

    // Calculate dynamic growth score
    const growth = await calculateGrowthScore({
      businessId: biz.id,
      seoScore: seo.score,
      aeoScore: aeo.score,
      geoScore: geo.score,
    });

    // Generate executive briefing
    const briefing = await generateExecutiveBriefing({
      businessName: biz.name,
      growthScore: growth.total,
      opportunities: finalOpps,
      competitors: finalCompetitors,
    });

    // Compute aggregate revenue stats
    const totalPotentialGain = finalOpps.reduce((sum, o) => sum + (o.revenue || 0), 0);
    const totalAtRisk = Math.round(totalPotentialGain * 0.25); // Heuristic risk calculation

    return {
      growthScore: growth.total,
      breakdown: growth.breakdown,
      explanation: growth.explanation,
      briefing,
      revenueImpact: {
        gain: totalPotentialGain,
        loss: totalAtRisk,
        trend: [
          { month: "Jan", gain: Math.round(totalPotentialGain * 0.4), loss: Math.round(totalAtRisk * 0.5) },
          { month: "Feb", gain: Math.round(totalPotentialGain * 0.5), loss: Math.round(totalAtRisk * 0.6) },
          { month: "Mar", gain: Math.round(totalPotentialGain * 0.7), loss: Math.round(totalAtRisk * 0.8) },
          { month: "Apr", gain: Math.round(totalPotentialGain * 0.8), loss: Math.round(totalAtRisk * 0.9) },
          { month: "May", gain: Math.round(totalPotentialGain * 0.9), loss: Math.round(totalAtRisk * 0.95) },
          { month: "Jun", gain: totalPotentialGain, loss: totalAtRisk },
        ]
      },
      healthMetrics: [
        { label: "SEO Score", value: `${seo.score}%`, delta: 0, hint: seo.score >= 80 ? "Healthy" : "Needs work" },
        { label: "AEO Score", value: `${aeo.score}%`, delta: 0, hint: aeo.score >= 80 ? "Healthy" : "Needs work" },
        { label: "GEO Score", value: `${geo.score}%`, delta: 0, hint: geo.score >= 80 ? "Healthy" : "Needs work" },
        { label: "Competitors", value: `${finalCompetitors.length} active`, delta: 0, hint: "Monitoring" },
        { label: "Customer Voice", value: "85%", delta: 0, hint: "Stable" },
        { label: "Revenue Engine", value: `₹${(totalPotentialGain / 1000).toFixed(1)}k`, delta: 0, hint: "Projected Lift" },
      ],
    };
  }
);

// ─── Get Tracked Competitors ──────────────────────────────────
export const getTrackedCompetitors = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();

    const fallbackTrend = [
      { month: "Jan", you: 68, competitor: 72 },
      { month: "Feb", you: 70, competitor: 74 },
      { month: "Mar", you: 75, competitor: 73 },
      { month: "Apr", you: 74, competitor: 75 },
      { month: "May", you: 79, competitor: 78 },
      { month: "Jun", you: 84, competitor: 80 },
    ];

    if (!token || token === "dev-token") {
      // Fallback dev mode list
      return {
        competitors: [
          { id: "1", name: "Veja", category: "Eco Sneakers", trafficTrend: -3, contentScore: 71, threatLevel: "Medium" },
          { id: "2", name: "Allbirds", category: "Sustainable Footwear", trafficTrend: 12, contentScore: 88, threatLevel: "High" },
          { id: "3", name: "On Running", category: "Performance Shoes", trafficTrend: 18, contentScore: 92, threatLevel: "High" },
        ],
        changes: [
          { name: "Veja", change: "New collab with Mansur Gavriel", type: "New Product", at: "1w ago" },
          { name: "Allbirds", change: "Published 4 sustainability articles", type: "New Content", at: "4d ago" },
        ],
        seoTrendSeries: fallbackTrend,
      };
    }

    const supabase = getSupabaseForUser(token);

    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(*)")
      .limit(1)
      .single();

    if (!membership) return { competitors: [], changes: [], seoTrendSeries: fallbackTrend };

    const biz = membership.businesses as any;

    const { data: list } = await supabase
      .from("competitors")
      .select("*")
      .eq("business_id", biz.id);

    let finalCompetitors = list || [];
    if (finalCompetitors.length === 0) {
      const discovery = await discoverCompetitors({
        businessId: biz.id,
        name: biz.name,
        url: biz.url,
        industry: biz.industry || "E-commerce retailer",
        description: biz.description || "",
        categories: biz.ai_profile?.categories || ["Apparel"],
        targetAudience: biz.ai_profile?.targetAudience || "General buyers",
      });
      // Retrieve the newly cached ones
      const { data: refetched } = await supabase
        .from("competitors")
        .select("*")
        .eq("business_id", biz.id);
      finalCompetitors = refetched || [];
    }

    // Map DB fields to UI-friendly types
    const mapped = finalCompetitors.map((c: any) => ({
      id: c.id,
      name: c.name,
      url: c.url,
      category: c.category || "General",
      threatLevel: c.threat_level || "Medium",
      contentScore: c.content_score || 70,
      trafficTrend: c.traffic_trend || 0,
    }));

    // Fetch changes from competitor_snapshots
    const competitorIds = finalCompetitors.map(c => c.id);
    const { data: dbSnapshots } = await supabase
      .from("competitor_snapshots")
      .select("*, competitors(name)")
      .in("competitor_id", competitorIds)
      .order("captured_at", { ascending: false });

    const changesList: any[] = [];
    if (dbSnapshots && dbSnapshots.length > 0) {
      for (const snap of dbSnapshots) {
        if (Array.isArray(snap.changes)) {
          for (const ch of snap.changes) {
            changesList.push({
              name: snap.competitors?.name || ch.name || "Competitor",
              change: ch.change,
              type: ch.type || "SEO",
              at: snap.captured_at ? new Date(snap.captured_at).toLocaleDateString() : "Recent",
            });
          }
        }
      }
    }

    if (changesList.length === 0) {
      changesList.push(
        { name: mapped[0]?.name || "Rival", change: "Updated meta-descriptions and keywords on homepage", type: "SEO", at: "2d ago" },
        { name: mapped[1]?.name || "Competitor", change: "Published new comparison guides", type: "New Content", at: "4d ago" }
      );
    }

    return {
      competitors: mapped,
      changes: changesList,
      seoTrendSeries: fallbackTrend,
    };
  }
);

// ─── Get Opportunities ────────────────────────────────────────
export const getGeneratedOpportunities = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();

    if (!token || token === "dev-token") {
      // Fallback dev mode opportunities
      return [
        { id: "1", title: "Capture AI overview for 'eco-friendly shoes'", type: "Content", impact: "High", difficulty: "Easy", revenue: 28500, actionPlan: "Add H2 question-based headings followed by short, factual answers.", status: "open" },
        { id: "2", title: "Rank for 'best vegan sneakers 2026'", type: "SEO", impact: "High", difficulty: "Medium", revenue: 42000, actionPlan: "Write an optimized listicle article and establish backlink partnerships.", status: "open" },
        { id: "3", title: "Deploy complete JSON-LD Product schema", type: "SEO", impact: "Medium", difficulty: "Easy", revenue: 14500, actionPlan: "Inject standardized schema metadata directly into your product template files.", status: "open" },
      ];
    }

    const supabase = getSupabaseForUser(token);

    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(*)")
      .limit(1)
      .single();

    if (!membership) return [];

    const biz = membership.businesses as any;

    const { data: opps } = await supabase
      .from("opportunities")
      .select("*")
      .eq("business_id", biz.id)
      .eq("status", "open");

    if (opps && opps.length > 0) {
      return opps.map((o: any) => ({
        id: o.id,
        title: o.title,
        type: o.type,
        impact: o.impact,
        difficulty: o.difficulty,
        revenue: o.revenue || 0,
        actionPlan: o.action_plan,
        status: o.status,
      }));
    }

    return [];
  }
);

// ─── Voice Agent Request ──────────────────────────────────────
export const askVoiceAgent = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    const token = await getToken();

    let businessName = "Northwind Apparel";
    let growthScore = 75;
    let explanation = "Good overall health with clear optimization fields.";
    let opportunities: any[] = [];
    let competitorsList: any[] = [];

    if (token) {
      try {
        const supabase = getSupabaseForUser(token);
        const { data: membership } = await supabase
          .from("business_members")
          .select("business_id, businesses(*)")
          .limit(1)
          .single();

        if (membership) {
          const biz = membership.businesses as any;
          businessName = biz.name;

          const dashboard = await getGrowthDashboard();
          growthScore = dashboard.growthScore;
          explanation = dashboard.explanation;

          opportunities = await getGeneratedOpportunities();
          const compData = await getTrackedCompetitors();
          competitorsList = compData.competitors;
        }
      } catch (e) {
        console.warn("Could not retrieve full voice agent business context:", e);
      }
    }

    if (opportunities.length === 0) {
      opportunities = [
        { title: "Capture AI overview for 'eco-friendly shoes'", revenue: 28500, recommendedAction: "Add FAQ schema markup to product pages." }
      ];
    }

    const response = await processVoiceQuery({
      query: data.query,
      businessName,
      growthScore,
      explanation,
      opportunities,
      competitors: competitorsList,
    });

    return response;
  });

// ─── Get Customer Voice Insights ────────────────────────────────
export const getCustomerInsights = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();

    const fallbackResult = {
      sentiment: [
        { name: "Positive", value: 78, color: "var(--color-success)" },
        { name: "Neutral", value: 14, color: "var(--color-muted-foreground)" },
        { name: "Negative", value: 8, color: "var(--color-destructive)" },
      ],
      buyingMotivations: [
        { reason: "Product Quality", pct: 40 },
        { reason: "Brand Sustainability", pct: 28 },
        { reason: "Design & Style", pct: 20 },
        { reason: "Fast Shipping", pct: 12 },
      ],
      painPoints: [
        { topic: "Delivery Delays", mentions: 84, severity: "Medium" as const },
        { topic: "Sizing Inconsistency", mentions: 67, severity: "High" as const },
        { topic: "Checkout UI Glitches", mentions: 32, severity: "Low" as const },
        { topic: "Packaging Waste", mentions: 28, severity: "Medium" as const },
      ],
      customerRequests: [
        "Add virtual sizing assistant to reduce size exchanges.",
        "Provide carbon-neutral shipping options at checkout.",
        "Release an expanded pastel color collection for summer.",
      ],
      reviews: [
        { name: "Jamie L.", text: "Love the comfort but sizing runs small — had to exchange twice.", tag: "Sizing" },
        { name: "Ravi P.", text: "Shipping took 11 days. Quality was great when it finally arrived.", tag: "Shipping" },
        { name: "Sofia M.", text: "Exactly what I wanted — sustainable AND stylish. Will buy again.", tag: "Positive" },
      ],
    };

    if (!token || token === "dev-token") return fallbackResult;

    const supabase = getSupabaseForUser(token);

    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(*)")
      .limit(1)
      .single();

    if (!membership) return fallbackResult;

    const biz = membership.businesses as any;

    const { data: insights } = await supabase
      .from("customer_insights")
      .select("*")
      .eq("business_id", biz.id);

    if (insights && insights.length > 0) {
      const sentiment = insights.find(i => i.insight_type === "sentiment")?.data || fallbackResult.sentiment;
      const buyingMotivations = insights.find(i => i.insight_type === "motivation")?.data || fallbackResult.buyingMotivations;
      const painPoints = insights.find(i => i.insight_type === "pain_point")?.data || fallbackResult.painPoints;
      const customerRequests = insights.find(i => i.insight_type === "request")?.data || fallbackResult.customerRequests;
      const reviews = insights.find(i => i.insight_type === "review")?.data || fallbackResult.reviews;

      return { sentiment, buyingMotivations, painPoints, customerRequests, reviews };
    }

    // Run Engine if not computed yet
    try {
      const analysis = await analyzeCustomerVoice(
        biz.name,
        biz.description || "",
        biz.ai_profile?.categories || ["Apparel"]
      );

      const adminSupabase = getSupabaseServer();
      const insightTypes = [
        { type: "sentiment" as const, data: analysis.sentiment },
        { type: "motivation" as const, data: analysis.buyingMotivations },
        { type: "pain_point" as const, data: analysis.painPoints },
        { type: "request" as const, data: analysis.customerRequests },
        { type: "review" as const, data: analysis.reviews },
      ];

      for (const insight of insightTypes) {
        await adminSupabase.from("customer_insights").insert({
          business_id: biz.id,
          insight_type: insight.type,
          data: insight.data,
        });
      }

      return analysis;
    } catch (e) {
      console.error(e);
      return fallbackResult;
    }
  }
);

// ─── Get Trend Radar Data ───────────────────────────────────────
export const getTrendRadar = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();

    const fallbackResult = {
      series: [
        { week: "Wk 1", barefoot: 40, recycled: 25, chunky: 80 },
        { week: "Wk 2", barefoot: 42, recycled: 27, chunky: 78 },
        { week: "Wk 3", barefoot: 45, recycled: 30, chunky: 75 },
        { week: "Wk 4", barefoot: 48, recycled: 35, chunky: 73 },
        { week: "Wk 5", barefoot: 55, recycled: 42, chunky: 70 },
        { week: "Wk 6", barefoot: 62, recycled: 48, chunky: 65 },
        { week: "Wk 7", barefoot: 70, recycled: 55, chunky: 60 },
        { week: "Wk 8", barefoot: 75, recycled: 62, chunky: 58 },
        { week: "Wk 9", barefoot: 78, recycled: 70, chunky: 55 },
        { week: "Wk 10", barefoot: 82, recycled: 75, chunky: 50 },
        { week: "Wk 11", barefoot: 85, recycled: 80, chunky: 48 },
        { week: "Wk 12", barefoot: 90, recycled: 88, chunky: 45 },
      ],
      rising: [
        { topic: "Barefoot trainers", signal: "Google Search volume spikes", growth: 125 },
        { topic: "Recycled materials", signal: "Tiktok Mentions", growth: 84 },
        { topic: "Minimalist running shoes", signal: "Subreddit growth r/barefootrunning", growth: 42 },
        { topic: "Zero-drop footwear", signal: "Pinterest boards shares", growth: 38 },
      ],
      declining: [
        { topic: "Chunky sneakers", signal: "Fashion blogs citation drop", growth: -35 },
        { topic: "Platform shoes", signal: "Sales volume indicators", growth: -20 },
        { topic: "Neoprene insoles", signal: "Social media engagement reduction", growth: -12 },
      ],
    };

    if (!token || token === "dev-token") return fallbackResult;

    const supabase = getSupabaseForUser(token);

    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(*)")
      .limit(1)
      .single();

    if (!membership) return fallbackResult;

    const biz = membership.businesses as any;

    const { data: dbTrends } = await supabase
      .from("trends")
      .select("*")
      .eq("business_id", biz.id);

    if (dbTrends && dbTrends.length > 0) {
      const rising = dbTrends.filter(t => t.direction === "rising").map(t => ({ topic: t.topic, signal: t.signal_source || "Web signal", growth: t.growth }));
      const declining = dbTrends.filter(t => t.direction === "declining").map(t => ({ topic: t.topic, signal: t.signal_source || "Web signal", growth: t.growth }));
      
      // Synthesize series trajectory from saved trend data points
      const seriesMap: { [week: string]: any } = {};
      dbTrends.forEach(t => {
        if (Array.isArray(t.data_points)) {
          t.data_points.forEach((pt: any) => {
            const topicKey = t.topic.toLowerCase().replace(/\s+/g, "");
            seriesMap[pt.week] = {
              ...seriesMap[pt.week],
              week: pt.week,
              [topicKey]: pt.value || 50
            };
          });
        }
      });
      const series = Object.values(seriesMap);

      return {
        series: series.length > 0 ? series : fallbackResult.series,
        rising: rising.length > 0 ? rising : fallbackResult.rising,
        declining: declining.length > 0 ? declining : fallbackResult.declining
      };
    }

    // Run Engine if not computed yet
    try {
      const analysis = await analyzeTrends(
        biz.name,
        biz.industry || "E-commerce retailer",
        biz.ai_profile?.categories || ["Apparel"]
      );

      const adminSupabase = getSupabaseServer();
      for (const rise of analysis.rising) {
        await adminSupabase.from("trends").insert({
          business_id: biz.id,
          topic: rise.topic,
          direction: "rising",
          growth: rise.growth,
          signal_source: rise.signal,
          data_points: analysis.series.map(pt => ({ week: pt.week, value: pt[rise.topic.toLowerCase().replace(/\s+/g, "")] ?? 50 }))
        });
      }

      for (const decline of analysis.declining) {
        await adminSupabase.from("trends").insert({
          business_id: biz.id,
          topic: decline.topic,
          direction: "declining",
          growth: decline.growth,
          signal_source: decline.signal,
          data_points: analysis.series.map(pt => ({ week: pt.week, value: pt[decline.topic.toLowerCase().replace(/\s+/g, "")] ?? 50 }))
        });
      }

      return analysis;
    } catch (e) {
      console.error(e);
      return fallbackResult;
    }
  }
);

// ─── Get Historical Growth Score Trends ─────────────────────────
export const getHistoricalGrowthTrends = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = await getToken();

    const fallbackResult = [
      { date: "Jan", score: 68 },
      { date: "Feb", score: 70 },
      { date: "Mar", score: 71 },
      { date: "Apr", score: 73 },
      { date: "May", score: 74 },
      { date: "Jun", score: 75 },
    ];

    if (!token || token === "dev-token") return fallbackResult;

    const supabase = getSupabaseForUser(token);

    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id")
      .limit(1)
      .single();

    if (!membership) return fallbackResult;

    const { data: scores } = await supabase
      .from("intelligence_scores")
      .select("score, computed_at")
      .eq("business_id", membership.business_id)
      .eq("score_type", "seo") // Use SEO scores as proxy or average
      .order("computed_at", { ascending: true })
      .limit(12);

    if (scores && scores.length > 0) {
      return scores.map(s => ({
        date: new Date(s.computed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: s.score
      }));
    }

    return fallbackResult;
  }
);

// ─── Trigger Daily Automation Pipeline ──────────────────────────
export const triggerDailyAutomationPipeline = createServerFn({ method: "POST" }).handler(
  async () => {
    const token = await getToken();
    if (!token || token === "dev-token") {
      return { success: true, message: "Automation pipeline executed in dev mode." };
    }

    const supabase = getSupabaseForUser(token);
    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id")
      .limit(1)
      .single();

    if (!membership) {
      return { success: false, error: "Business profile not found" };
    }

    return await runDailyAutomation(membership.business_id);
  }
);
