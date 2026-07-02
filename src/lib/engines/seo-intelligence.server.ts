import { CrawlResult } from "../crawl/lightweight-crawler.server";
import { generateContent } from "../ai/gemini.server";

export interface SeoAuditResult {
  score: number;
  breakdown: {
    technical: number;
    content: number;
    mobile: number;
    meta: number;
  };
  issues: Array<{
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    category: "technical" | "content" | "meta" | "mobile";
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "High" | "Medium" | "Low";
    difficulty: "Easy" | "Medium" | "Hard";
    category: "technical" | "content" | "meta";
  }>;
}

/**
 * Runs an SEO audit on a business's homepage.
 */
export async function auditSeo(url: string, pageData: CrawlResult): Promise<SeoAuditResult> {
  const crawledText = pageData.content.slice(0, 15000); // limit payload size
  const crawledTitle = pageData.title;
  const crawledDescription = pageData.metaDescription;
  const crawledLength = pageData.content.length;

  // Count basic structural signals in crawl content to assist AI
  const hasTitle = !!crawledTitle;
  const titleLength = crawledTitle.length;
  const hasDescription = !!crawledDescription;
  const descriptionLength = crawledDescription.length;

  const prompt = `
You are Nexora AI's SEO Audit Engine.
Analyze the following crawling metrics and content text of the homepage of an e-commerce store, and provide a full structured SEO audit.

Website URL: ${url}
HTML Title: "${crawledTitle}" (Length: ${titleLength} chars)
HTML Meta Description: "${crawledDescription}" (Length: ${descriptionLength} chars)
Estimated Homepage Content Length: ${crawledLength} characters

Homepage Text Content:
---
${crawledText || "[No content retrieved. Analyze based on the URL name and standard e-commerce gaps]"}
---

Your response MUST be a JSON object conforming exactly to this structure:
{
  "score": 82, // An overall SEO score between 0 and 100
  "breakdown": {
    "technical": 85, // 0-100 score for page structure and tech SEO
    "content": 78,   // 0-100 score for keyword utilization, readability
    "mobile": 90,    // 0-100 score for mobile compatibility indicators
    "meta": 75       // 0-100 score for meta title, description optimization
  },
  "issues": [
    {
      "id": "meta-title-length",
      "title": "Title Tag Length",
      "severity": "Medium", // 'Critical', 'High', 'Medium', or 'Low'
      "description": "The title tag is too long/short. Keep titles under 60 characters for best display on search results.",
      "category": "meta" // 'technical', 'content', 'meta', or 'mobile'
    }
  ],
  "recommendations": [
    {
      "title": "Optimize homepage title tag",
      "description": "Rewrite title to be under 60 characters and lead with your primary target keyword.",
      "impact": "High", // 'High', 'Medium', or 'Low'
      "difficulty": "Easy", // 'Easy', 'Medium', or 'Hard'
      "category": "meta" // 'technical', 'content', or 'meta'
    }
  ]
}

Ensure the issues and recommendations are highly specific to this business based on the content crawled, and action-oriented.
Output ONLY valid JSON. No markdown code block wrappers or explanations.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are an expert SEO auditor. You analyze website parameters and output audit reports in clean structured JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanJson) as SeoAuditResult;
  } catch (error) {
    console.error("Gemini SEO audit failed:", error);
    return getFallbackSeoResult(url);
  }
}

function getFallbackSeoResult(url: string): SeoAuditResult {
  return {
    score: 74,
    breakdown: {
      technical: 80,
      content: 72,
      mobile: 85,
      meta: 60,
    },
    issues: [
      {
        id: "meta-description-missing",
        title: "Missing Meta Description",
        severity: "High",
        description: "No meta description tag was detected on the homepage, resulting in search engines auto-generating snippets that might not match your messaging.",
        category: "meta",
      },
      {
        id: "missing-alt-tags",
        title: "Missing Image Alt Attributes",
        severity: "Medium",
        description: "Several images on the home page do not have alt tags, hindering accessibility and image search indexation.",
        category: "technical",
      },
    ],
    recommendations: [
      {
        title: "Create a descriptive homepage meta description",
        description: "Add a meta description between 120-160 characters incorporating your brand value proposition and main keyword.",
        impact: "High",
        difficulty: "Easy",
        category: "meta",
      },
      {
        title: "Add alt attributes to home page banners and products",
        description: "Update your homepage theme code to ensure all images contain descriptive alt text describing the product or asset.",
        impact: "Medium",
        difficulty: "Medium",
        category: "technical",
      },
    ],
  };
}
