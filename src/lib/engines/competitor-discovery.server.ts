import { generateContent } from "../ai/gemini.server";
import { getSupabaseServer } from "../supabase.server";

export interface DiscoveredCompetitor {
  name: string;
  url: string;
  category: string;
  threatLevel: "Low" | "Medium" | "High";
  contentScore: number;
  trafficTrend: number;
  type: "direct" | "indirect" | "leader";
  similarityScore: number; // 0-100
}

export interface CompetitorDiscoveryResult {
  competitors: DiscoveredCompetitor[];
}

/**
 * Discovers and ranks competitors based on e-commerce business parameters.
 */
export async function discoverCompetitors(params: {
  businessId: string;
  name: string;
  url: string;
  industry: string;
  description: string;
  categories: string[];
  targetAudience: string;
}): Promise<CompetitorDiscoveryResult> {
  const adminSupabase = getSupabaseServer();

  // 1. Try to fetch cached competitors from database if businessId is valid
  if (params.businessId && params.businessId !== "dev-business-id") {
    try {
      const { data: cached, error } = await adminSupabase
        .from("competitors")
        .select("*")
        .eq("business_id", params.businessId);

      if (!error && cached && cached.length > 0) {
        return {
          competitors: cached.map((c: any) => ({
            name: c.name,
            url: c.url,
            category: c.category || "General",
            threatLevel: c.threat_level as "Low" | "Medium" | "High",
            contentScore: c.content_score || 70,
            trafficTrend: c.traffic_trend || 0,
            type: (c.category?.toLowerCase().includes("leader") ? "leader" : "direct") as any,
            similarityScore: 80, // Default similarity for cached items
          })),
        };
      }
    } catch (e) {
      console.warn("Error fetching cached competitors:", e);
    }
  }

  // 2. Call Gemini to discover competitors based on profile details
  const prompt = `
You are Nexora AI's Competitor Discovery Engine.
Analyze the following business profile for an e-commerce brand and discover 5 top competitors.
Identify direct competitors (selling similar products to similar audiences), indirect competitors (selling alternative products to similar audiences), and market leaders (prominent players in the same industry).

Business Details:
- Name: "${params.name}"
- Website: "${params.url}"
- Industry: "${params.industry}"
- Description: "${params.description}"
- Categories: ${JSON.stringify(params.categories)}
- Target Audience: "${params.targetAudience}"

For each competitor, provide:
1. Brand Name
2. Website URL (a plausible domain name, e.g. "brandname.com")
3. Category (e.g. "Sustainable Apparel", "Specialty Coffee")
4. Threat Level ("Low", "Medium", "High")
5. Similarity Score (percentage 0 to 100, where 100 is identical business model/products)
6. Competitor Type ("direct", "indirect", or "leader")
7. Estimated Content Score (an estimated rating of their content quality 0-100)
8. Traffic Trend (a positive or negative percentage, e.g. 12 or -5)

Your response must be a JSON object conforming exactly to this structure:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://competitor.com",
      "category": "Competitor Category",
      "threatLevel": "High",
      "similarityScore": 92,
      "type": "direct",
      "contentScore": 85,
      "trafficTrend": 12
    }
  ]
}

Identify realistic e-commerce brands relevant to this business. If you cannot identify real brands, generate highly realistic and relevant competitors.
Output ONLY valid JSON. No markdown code blocks or explanations.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are a competitive intelligence analyst. You identify and analyze competitor ecosystems for e-commerce websites and output structured JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const result = JSON.parse(cleanJson) as CompetitorDiscoveryResult;

    // 3. Cache discovered competitors to database
    if (params.businessId && params.businessId !== "dev-business-id" && result.competitors.length > 0) {
      try {
        // Fetch existing competitors for the business to perform upsert and avoid foreign key cascade deletions
        const { data: existingCompetitors } = await adminSupabase
          .from("competitors")
          .select("id, name")
          .eq("business_id", params.businessId);

        const existingMap = new Map((existingCompetitors || []).map(c => [c.name.toLowerCase(), c]));
        const inserts = [];

        for (const c of result.competitors) {
          const nameLower = c.name.toLowerCase();
          if (existingMap.has(nameLower)) {
            const existing = existingMap.get(nameLower)!;
            // Update existing record
            await adminSupabase
              .from("competitors")
              .update({
                url: c.url,
                category: c.category,
                threat_level: c.threatLevel,
                content_score: c.contentScore,
                traffic_trend: c.trafficTrend,
              })
              .eq("id", existing.id);
          } else {
            // Queue for insert
            inserts.push({
              business_id: params.businessId,
              name: c.name,
              url: c.url,
              category: c.category,
              threat_level: c.threatLevel,
              content_score: c.contentScore,
              traffic_trend: c.trafficTrend,
            });
          }
        }

        if (inserts.length > 0) {
          await adminSupabase.from("competitors").insert(inserts);
        }
      } catch (cacheError) {
        console.warn("Failed to cache discovered competitors:", cacheError);
      }
    }

    return result;
  } catch (error) {
    console.error("Competitor discovery failed, returning fallback:", error);
    return getFallbackCompetitorDiscovery(params.name);
  }
}

function getFallbackCompetitorDiscovery(brandName: string): CompetitorDiscoveryResult {
  return {
    competitors: [
      {
        name: `${brandName} Rival A`,
        url: "https://rival-a.com",
        category: "Direct Competitor",
        threatLevel: "High",
        contentScore: 84,
        trafficTrend: 15,
        type: "direct",
        similarityScore: 90,
      },
      {
        name: `${brandName} Rival B`,
        url: "https://rival-b.com",
        category: "Direct Competitor",
        threatLevel: "Medium",
        contentScore: 78,
        trafficTrend: -4,
        type: "direct",
        similarityScore: 82,
      },
      {
        name: "EcoShop Giant",
        url: "https://ecoshopgiant.com",
        category: "Market Leader",
        threatLevel: "High",
        contentScore: 92,
        trafficTrend: 22,
        type: "leader",
        similarityScore: 65,
      },
      {
        name: "Alternative Goods Co",
        url: "https://alternativegoods.com",
        category: "Indirect Competitor",
        threatLevel: "Low",
        contentScore: 72,
        trafficTrend: 2,
        type: "indirect",
        similarityScore: 45,
      },
    ],
  };
}
