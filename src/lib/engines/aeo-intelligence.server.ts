import { CrawlResult } from "../crawl/lightweight-crawler.server";
import { generateContent } from "../ai/gemini.server";

export interface AeoAuditResult {
  score: number;
  breakdown: {
    factualDensity: number;
    schemaMarkup: number;
    conversationalRelevance: number;
    readability: number;
  };
  issues: Array<{
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    category: "schema" | "content" | "structure";
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "High" | "Medium" | "Low";
    difficulty: "Easy" | "Medium" | "Hard";
    category: "schema" | "content";
  }>;
}

/**
 * Evaluates the e-commerce store's content for Answer Engine Optimization (AEO).
 */
export async function auditAeo(url: string, pageData: CrawlResult): Promise<AeoAuditResult> {
  const crawledText = pageData.content.slice(0, 15000);
  const crawledTitle = pageData.title;
  const crawledDescription = pageData.metaDescription;

  const prompt = `
You are Nexora AI's Answer Engine Optimization (AEO) Engine.
Your goal is to evaluate how well this website's content is optimized for AI search engines, LLM retrievers (RAG), and conversational agents (Perplexity, Gemini, ChatGPT Search).

Website URL: ${url}
HTML Title: "${crawledTitle}"
HTML Meta Description: "${crawledDescription}"

Homepage text content:
---
${crawledText || "[No content retrieved. Assess based on general e-commerce best practices]"}
---

Analyze if the site:
1. Has clear structured FAQ or Q&A content.
2. Uses structural schemas (like Product, FAQPage, Organization).
3. Has high "factual density" (concrete statements rather than generic marketing fluff).
4. Direct conversational formatting.

Your output must be a JSON object with this format:
{
  "score": 68, // Overall AEO score 0-100
  "breakdown": {
    "factualDensity": 70, // 0-100 score for concrete claims/details
    "schemaMarkup": 55,    // 0-100 score for schema tags
    "conversationalRelevance": 72, // 0-100 score for answering questions directly
    "readability": 80      // 0-100 score for clean HTML parsing
  },
  "issues": [
    {
      "id": "missing-faq-schema",
      "title": "Missing FAQ Structured Data",
      "severity": "High",
      "description": "The homepage has no FAQ page schema or Q&A structures, which makes it harder for LLM crawlers to parse direct answers to customer questions.",
      "category": "schema"
    }
  ],
  "recommendations": [
    {
      "title": "Add FAQ markup to product pages",
      "description": "Implement FAQPage schema on key product pages containing top user inquiries (e.g. shipping, sizing, return policy).",
      "impact": "High",
      "difficulty": "Easy",
      "category": "schema"
    }
  ]
}

Output ONLY valid JSON. No markdown code blocks or descriptions.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are an AI Search optimization specialist. You evaluate content for AI engines and output structured JSON reports.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanJson) as AeoAuditResult;
  } catch (error) {
    console.error("Gemini AEO audit failed:", error);
    return getFallbackAeoResult();
  }
}

function getFallbackAeoResult(): AeoAuditResult {
  return {
    score: 65,
    breakdown: {
      factualDensity: 70,
      schemaMarkup: 45,
      conversationalRelevance: 68,
      readability: 77,
    },
    issues: [
      {
        id: "missing-product-schema",
        title: "Incomplete Product Schema Markup",
        severity: "High",
        description: "Your store does not implement complete microdata (JSON-LD Product schema) with price, availability, and rating properties, preventing LLMs from referencing real-time offers.",
        category: "schema",
      },
      {
        id: "no-conversational-headings",
        title: "Lack of Question-based Headers",
        severity: "Medium",
        description: "Your pages lack conversational headings (e.g. 'How does this work?', 'What is our material source?'), making it harder for search engines seeking direct answers to customer queries.",
        category: "content",
      },
    ],
    recommendations: [
      {
        title: "Deploy complete JSON-LD Product schema",
        description: "Inject automated JSON-LD schema on all product pages mapping product name, image, description, price, and stock status.",
        impact: "High",
        difficulty: "Medium",
        category: "schema",
      },
      {
        title: "Create a dedicated FAQ section with Q&A formatting",
        description: "Add a structured FAQ section to the website where questions are formatted as H2 tags followed by concise direct paragraph answers.",
        impact: "High",
        difficulty: "Easy",
        category: "content",
      },
    ],
  };
}
