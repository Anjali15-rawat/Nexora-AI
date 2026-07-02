import { getSupabaseServer } from "../supabase.server";
import { auditSeo } from "./seo-intelligence.server";
import { auditAeo } from "./aeo-intelligence.server";
import { auditGeo } from "./geo-intelligence.server";
import { discoverCompetitors } from "./competitor-discovery.server";
import { generateOpportunities } from "./opportunity-engine.server";
import { calculateGrowthScore } from "./growth-score.server";
import { generateExecutiveBriefing } from "./executive-briefing.server";
import { analyzeCustomerVoice } from "./customer-voice.server";
import { analyzeTrends } from "./trend-radar.server";
import { detectAndRecordChange } from "../api/automation.functions";
import { crawlPage } from "../crawl/lightweight-crawler.server";

/**
 * Runs a complete, automated daily intelligence cycle for a given business ID.
 * Performs crawling, SEO/AEO/GEO Auditing, Competitor scan, Customer Voice scan,
 * Trend Radar scan, Growth Score updates, and Morning Briefing updates.
 */
export async function runDailyAutomation(businessId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();

  // 1. Fetch business details
  const { data: biz, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (bizError || !biz) {
    return { success: false, error: "Business profile not found" };
  }

  try {
    const url = biz.url;
    console.log(`[Daily Automation] Starting daily cycle for business: ${biz.name} (${businessId}) on URL: ${url}`);

    // 2. Perform a single crawl, then run Intelligence audits concurrently
    const pageData = await crawlPage(url);
    const [seoResult, aeoResult, geoResult] = await Promise.all([
      auditSeo(url, pageData),
      auditAeo(url, pageData),
      auditGeo(url, pageData),
    ]);

    // 3. For each audit type, compute delta and insert
    const auditTypes = [
      { type: "seo" as const, result: seoResult },
      { type: "aeo" as const, result: aeoResult },
      { type: "geo" as const, result: geoResult },
    ];

    for (const audit of auditTypes) {
      const { data: previous } = await supabase
        .from("intelligence_scores")
        .select("score")
        .eq("business_id", businessId)
        .eq("score_type", audit.type)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const prevScore = previous?.score ?? audit.result.score;
      const delta = audit.result.score - prevScore;

      let hint = "";
      if (audit.type === "seo") hint = "Meta titles and image alt tags need optimization.";
      else if (audit.type === "aeo") hint = "Product FAQ schema structures are incomplete.";
      else hint = "Authority citations in Google AI Overviews are low.";

      await supabase.from("intelligence_scores").insert({
        business_id: businessId,
        score_type: audit.type,
        score: audit.result.score,
        delta,
        breakdown: audit.result.breakdown,
        issues: audit.result.issues,
        recommendations: audit.result.recommendations,
        hint,
      });

      // Change Detection
      const { changed } = await detectAndRecordChange(businessId, `${audit.type}_score`, { score: audit.result.score, issues: audit.result.issues.length });
      if (changed && Math.abs(delta) >= 5) {
        await supabase.from("notifications").insert({
          business_id: businessId,
          type: delta > 0 ? 'success' : 'alert',
          title: `${audit.type.toUpperCase()} Score ${delta > 0 ? 'Increased' : 'Decreased'}`,
          message: `Your ${audit.type.toUpperCase()} score changed by ${Math.abs(delta)} points.`,
          is_read: false
        });
      }
    }

    // 4. Competitor Discovery
    const discovery = await discoverCompetitors({
      businessId,
      name: biz.name,
      url: biz.url,
      industry: biz.industry || "E-commerce retailer",
      description: biz.description || "",
      categories: biz.ai_profile?.categories || ["Apparel"],
      targetAudience: biz.ai_profile?.targetAudience || "General buyers",
    });

    // Take point-in-time competitor snapshot updates for movement tracking
    const { data: listCompetitors } = await supabase
      .from("competitors")
      .select("*")
      .eq("business_id", businessId);

    const competitorsList = listCompetitors || [];

    for (const competitor of competitorsList) {
      // Simulate point-in-time snapshot with some random/AI changes
      const snapshotChanges = [
        {
          name: competitor.name,
          change: Math.random() > 0.5 
            ? "Updated meta descriptions and keywords on their homepage" 
            : "Published 3 new articles targeting sustainability search volume",
          type: Math.random() > 0.5 ? "New Product" : "New Content",
          at: "Recent"
        }
      ];

      await supabase.from("competitor_snapshots").insert({
        competitor_id: competitor.id,
        snapshot_data: {
          traffic: competitor.traffic_trend,
          contentScore: competitor.content_score,
          threatLevel: competitor.threat_level
        },
        changes: snapshotChanges
      });
    }

    // 5. Generate Opportunities
    const allIssues = [
      ...seoResult.issues,
      ...aeoResult.issues,
      ...geoResult.issues,
    ];
    const allRecs = [
      ...seoResult.recommendations,
      ...aeoResult.recommendations,
      ...geoResult.recommendations,
    ];

    const opGen = await generateOpportunities({
      businessId,
      businessName: biz.name,
      businessUrl: biz.url,
      industry: biz.industry || "E-commerce retailer",
      description: biz.description || "",
      seoScore: seoResult.score,
      aeoScore: aeoResult.score,
      geoScore: geoResult.score,
      seoIssues: allIssues,
      aeoIssues: allRecs,
      geoIssues: [],
      competitors: discovery.competitors,
    });

    // 6. Growth Score Engine update
    const growth = await calculateGrowthScore({
      businessId,
      seoScore: seoResult.score,
      aeoScore: aeoResult.score,
      geoScore: geoResult.score,
    });

    const { changed: growthChanged, previousState: prevGrowth } = await detectAndRecordChange(businessId, "growth_score", { total: growth.total });
    if (growthChanged && prevGrowth) {
      const gDelta = growth.total - (prevGrowth.total || growth.total);
      if (Math.abs(gDelta) >= 3) {
        await supabase.from("notifications").insert({
          business_id: businessId,
          type: gDelta > 0 ? 'success' : 'alert',
          title: `Business Health ${gDelta > 0 ? 'Improved' : 'Declined'}`,
          message: `Your overall growth score has moved to ${growth.total}.`,
          is_read: false
        });
      }
    }

    // 7. Executive Morning Briefing
    await generateExecutiveBriefing({
      businessName: biz.name,
      growthScore: growth.total,
      opportunities: opGen.opportunities,
      competitors: discovery.competitors,
    });

    // 8. Customer Voice Engine Run
    const customerVoice = await analyzeCustomerVoice(
      biz.name,
      biz.description || "",
      biz.ai_profile?.categories || ["Apparel"]
    );

    // Save Customer Insights to database
    const insightTypes = [
      { type: "sentiment" as const, data: customerVoice.sentiment },
      { type: "motivation" as const, data: customerVoice.buyingMotivations },
      { type: "pain_point" as const, data: customerVoice.painPoints },
      { type: "request" as const, data: customerVoice.customerRequests },
      { type: "review" as const, data: customerVoice.reviews },
    ];

    for (const insight of insightTypes) {
      await supabase.from("customer_insights").insert({
        business_id: businessId,
        insight_type: insight.type,
        data: insight.data,
      });
    }

    // 9. Trend Radar Engine Run
    const trendRadar = await analyzeTrends(
      biz.name,
      biz.industry || "E-commerce retailer",
      biz.ai_profile?.categories || ["Apparel"]
    );

    // Save Trends to DB
    for (const rise of trendRadar.rising) {
      await supabase.from("trends").insert({
        business_id: businessId,
        topic: rise.topic,
        direction: "rising",
        growth: rise.growth,
        signal_source: rise.signal,
        data_points: trendRadar.series.map(pt => ({ week: pt.week, value: pt[rise.topic.toLowerCase().replace(/\s+/g, "")] ?? 50 }))
      });
    }

    for (const decline of trendRadar.declining) {
      await supabase.from("trends").insert({
        business_id: businessId,
        topic: decline.topic,
        direction: "declining",
        growth: decline.growth,
        signal_source: decline.signal,
        data_points: trendRadar.series.map(pt => ({ week: pt.week, value: pt[decline.topic.toLowerCase().replace(/\s+/g, "")] ?? 50 }))
      });
    }

    console.log(`[Daily Automation] Daily automation pipeline finished successfully for ${biz.name}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Daily Automation] Automation cycle failed:`, error);
    return { success: false, error: error?.message || "Automation failed" };
  }
}
