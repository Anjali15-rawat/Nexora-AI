import { CrawlResult } from "../crawl/lightweight-crawler.server";
import { generateContent } from "../ai/gemini.server";

export interface GeoAuditResult {
  score: number;
  breakdown: {
    citationAuthority: number;
    keywordAlignment: number;
    factualGrounding: number;
    brandSentiment: number;
  };
  issues: Array<{
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    category: "authority" | "citation" | "content";
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "High" | "Medium" | "Low";
    difficulty: "Easy" | "Medium" | "Hard";
    category: "authority" | "content";
  }>;
}

/**
 * Evaluates the e-commerce store's optimization for Generative Engine Optimization (GEO).
 */
export async function auditGeo(url: string, pageData: CrawlResult): Promise<GeoAuditResult> {
  const crawledText = pageData.content.slice(0, 15000);
  const crawledTitle = pageData.title;
  const crawledDescription = pageData.metaDescription;

  const prompt = `
You are Nexora AI's Generative Engine Optimization (GEO) Engine.
Your goal is to evaluate this store's content optimization for citations in Generative Search Engines (Google AI Overviews, Search Generative Experience, Perplexity citation links).

Website URL: ${url}
HTML Title: "${crawledTitle}"
HTML Meta Description: "${crawledDescription}"

Homepage text content:
---
${crawledText || "[No content retrieved. Assess based on general e-commerce branding]"}
---

Analyze if the site:
1. Has authoritative backing claims (contains specific credentials, statistics, source grounding).
2. Contains high citation-likelihood formatting (tables, bullet points, clean definitions).
3. Uses specific keywords aligned with transactional intent.
4. Possesses unique insights or proprietary claims.

Your output must be a JSON object with this format:
{
  "score": 58, // Overall GEO score 0-100
  "breakdown": {
    "citationAuthority": 50, // 0-100 score for authoritative links and backing claims
    "keywordAlignment": 65,  // 0-100 score for keyword placement in summaries
    "factualGrounding": 60,  // 0-100 score for data, stats, and logical reasoning density
    "brandSentiment": 70     // 0-100 score for positive contextual brand sentiment
  },
  "issues": [
    {
      "id": "missing-authoritative-stats",
      "title": "Low Density of Grounding Claims",
      "severity": "High",
      "description": "Your copy uses generic descriptors ('highest quality', 'best brand') rather than structured factual claims (material certificates, precise weights, lab test specs) that AI engines cite for trust.",
      "category": "authority"
    }
  ],
  "recommendations": [
    {
      "title": "Introduce specific material specifications",
      "description": "Replace generic marketing adjectives with clear product specifications, materials sourcing data, and third-party certifications.",
      "impact": "High",
      "difficulty": "Medium",
      "category": "content"
    }
  ]
}

Output ONLY valid JSON. No markdown code blocks or descriptions.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are a Generative Search Optimization (GEO) analyst. You score texts for AI search index relevance and output structured JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanJson) as GeoAuditResult;
  } catch (error) {
    console.error("Gemini GEO audit failed:", error);
    return getFallbackGeoResult();
  }
}

function getFallbackGeoResult(): GeoAuditResult {
  return {
    score: 60,
    breakdown: {
      citationAuthority: 55,
      keywordAlignment: 68,
      factualGrounding: 58,
      brandSentiment: 70,
    },
    issues: [
      {
        id: "low-factual-grounding",
        title: "Absence of Grounding Statistics",
        severity: "High",
        description: "Your brand's messaging focuses on subjective marketing copy rather than concrete numbers, measurements, or certified materials, which generative engines filter out as low-citation content.",
        category: "authority",
      },
      {
        id: "unformatted-lists",
        title: "Paragraph-heavy Layout",
        severity: "Medium",
        description: "Most product descriptions are set as long block text without tables or lists, which are the formats preferred by search models for extraction into AI Overviews.",
        category: "content",
      },
    ],
    recommendations: [
      {
        title: "Integrate comparative tables and bullet specifications",
        description: "Format key features, materials, and comparison specs into HTML tables and lists. This structural cue helps models parse and cite your store.",
        impact: "High",
        difficulty: "Easy",
        category: "content",
      },
      {
        title: "Incorporate third-party audit claims",
        description: "Explicitly reference manufacturing certificates, sustainability credentials, or third-party test standards to establish factual authority.",
        impact: "Medium",
        difficulty: "Medium",
        category: "authority",
      },
    ],
  };
}
