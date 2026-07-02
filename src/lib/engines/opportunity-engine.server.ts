import { generateContent } from "../ai/gemini.server";
import { getSupabaseServer } from "../supabase.server";
import { getRevenueImpact } from "./revenue-impact.server";

export interface GeneratedOpportunity {
  title: string;
  description: string;
  category: "SEO" | "AEO" | "GEO" | "Content" | "Product" | "Trend" | "Pricing" | "CRO";
  difficulty: "Easy" | "Medium" | "Hard";
  confidence: number; // 0-100
  estimatedVisibilityImpact: "Low" | "Medium" | "High";
  recommendedAction: string;
  revenue?: number; // Calculated or populated later
}

export interface OpportunityEngineResult {
  opportunities: GeneratedOpportunity[];
}

/**
 * Aggregates site metrics and details from all engines to generate highly personalized growth opportunities.
 */
export async function generateOpportunities(params: {
  businessId: string;
  businessName: string;
  businessUrl: string;
  industry: string;
  description: string;
  seoScore: number;
  aeoScore: number;
  geoScore: number;
  seoIssues: any[];
  aeoIssues: any[];
  geoIssues: any[];
  competitors: any[];
}): Promise<OpportunityEngineResult> {
  const adminSupabase = getSupabaseServer();

  // Call Gemini to generate growth opportunities based on consolidated data
  const prompt = `
You are Nexora AI's Opportunity Engine.
Analyze the following e-commerce brand audit findings and competitor profile to identify and prioritize 5 actionable growth opportunities.

Business: "${params.businessName}" (${params.businessUrl})
Industry: "${params.industry}"
Description: "${params.description}"

Current Scores:
- SEO Visibility: ${params.seoScore}/100
- AEO Readiness: ${params.aeoScore}/100
- GEO Citations: ${params.geoScore}/100

Top Issues Detected:
- SEO: ${JSON.stringify(params.seoIssues.map(i => i.title))}
- AEO: ${JSON.stringify(params.aeoIssues.map(i => i.title))}
- GEO: ${JSON.stringify(params.geoIssues.map(i => i.title))}

Tracked Competitors:
${JSON.stringify(params.competitors.map(c => ({ name: c.name, threat: c.threat_level || c.threat })))}

Generate 5 high-impact, unique growth opportunities. Provide:
1. Title (action-oriented)
2. Description
3. Category (must be one of: "SEO", "AEO", "GEO", "Content", "Product", "Trend", "Pricing", "CRO")
4. Difficulty ("Easy", "Medium", "Hard")
5. Confidence (0 to 100 percentage)
6. Estimated Visibility Impact ("Low", "Medium", "High")
7. Recommended Action (a step-by-step description of what to do next)

Your response must be a JSON object conforming exactly to this structure:
{
  "opportunities": [
    {
      "title": "Opportunity Title",
      "description": "Short description of the opportunity.",
      "category": "SEO",
      "difficulty": "Easy",
      "confidence": 85,
      "estimatedVisibilityImpact": "High",
      "recommendedAction": "Implement structural meta tag checks on the homepage."
    }
  ]
}

Ensure all generated opportunities are highly customized to the business and focus on driving actual revenue and search engine footprints.
Output ONLY valid JSON. No markdown code blocks or explanations.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are an expert growth strategist. You analyze technical and competitive e-commerce parameters and output optimized growth plans in structured JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const result = JSON.parse(cleanJson) as OpportunityEngineResult;

    // Remove duplicates by title
    const seen = new Set<string>();
    const uniqueOpportunities = result.opportunities.filter((o) => {
      const key = o.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Populate projected revenue impact for each opportunity
    const opportunitiesWithRevenue = uniqueOpportunities.map((o) => {
      const impact = getRevenueImpact(o.title, o.category, o.difficulty, o.estimatedVisibilityImpact);
      return {
        ...o,
        revenue: impact.potentialRevenue,
        confidence: impact.confidence,
      };
    });

    // Cache opportunities in database if businessId is valid
    if (params.businessId && params.businessId !== "dev-business-id" && opportunitiesWithRevenue.length > 0) {
      try {
        // Clear any old open opportunities
        await adminSupabase
          .from("opportunities")
          .delete()
          .eq("business_id", params.businessId)
          .eq("status", "open");

        const rows = opportunitiesWithRevenue.map((o) => ({
          business_id: params.businessId,
          title: o.title,
          type: o.category,
          impact: o.estimatedVisibilityImpact,
          difficulty: o.difficulty,
          revenue: o.revenue,
          action_plan: o.recommendedAction,
          status: "open" as const,
        }));

        await adminSupabase.from("opportunities").insert(rows);
      } catch (cacheError) {
        console.warn("Failed to cache opportunities:", cacheError);
      }
    }

    return { opportunities: opportunitiesWithRevenue };
  } catch (error) {
    console.error("Opportunity generation failed, returning fallback:", error);
    return getFallbackOpportunities();
  }
}

function getFallbackOpportunities(): OpportunityEngineResult {
  return {
    opportunities: [
      {
        title: "Rank for 'best vegan sneakers 2026'",
        description: "Your sustainable activewear catalog is primed to capture this emerging informational keyword search phrase.",
        category: "SEO",
        difficulty: "Medium",
        confidence: 85,
        estimatedVisibilityImpact: "High",
        recommendedAction: "Write an optimized listicle article and establish backlink partnerships.",
        revenue: 42000,
      },
      {
        title: "Capture AI overview for 'eco-friendly shoes'",
        description: "Optimize direct conversational paragraph headers on collection pages to match Google Gemini and Perplexity search answers.",
        category: "Content",
        difficulty: "Easy",
        confidence: 90,
        estimatedVisibilityImpact: "High",
        recommendedAction: "Add H2 question-based headings followed by short, factual answers.",
        revenue: 28500,
      },
      {
        title: "Deploy complete JSON-LD Product schema",
        description: "Fix structured product schemas on the top e-commerce PDPs so that shopping bots can index prices, reviews, and stocks.",
        category: "SEO",
        difficulty: "Easy",
        confidence: 95,
        estimatedVisibilityImpact: "Medium",
        recommendedAction: "Inject standardized schema metadata directly into your product template files.",
        revenue: 14500,
      },
    ],
  };
}
