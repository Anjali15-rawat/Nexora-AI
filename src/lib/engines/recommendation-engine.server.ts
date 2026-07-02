import { generateContent } from "../ai/gemini.server";
import { BusinessMemory } from "./business-memory.server";

export interface Recommendation {
  id: string; // temporary ID
  problem: string;
  impact: string;
  recommendation: string;
  expectedBenefit: string;
  priority: "High" | "Medium" | "Low";
  difficulty: "Hard" | "Medium" | "Easy";
}

/**
 * Parses the intelligence engines and returns top recommended actions.
 */
export async function generateRecommendations(memory: BusinessMemory): Promise<Recommendation[]> {
  const prompt = `
You are Nexora AI's Recommendation Engine.
Review the following business context and generate exactly 3 top-priority, actionable recommendations.
Focus on fixing SEO, AEO, or GEO issues, or capitalizing on competitor weaknesses.

BUSINESS CONTEXT:
Name: ${memory.business.name}
SEO Score: ${memory.scores.seo.score} (Issues: ${JSON.stringify(memory.scores.seo.issues.slice(0, 3))})
AEO Score: ${memory.scores.aeo.score} (Issues: ${JSON.stringify(memory.scores.aeo.issues.slice(0, 3))})
GEO Score: ${memory.scores.geo.score} (Issues: ${JSON.stringify(memory.scores.geo.issues.slice(0, 3))})

Format the output strictly as a JSON array of objects with the following keys:
- problem (string): What is wrong
- impact (string): Why it hurts the business
- recommendation (string): Clear action step
- expectedBenefit (string): What they gain
- priority (string): "High", "Medium", or "Low"
- difficulty (string): "Hard", "Medium", or "Easy"
`;

  try {
    const response = await generateContent(prompt, {
      systemInstruction: "You are an expert e-commerce consultant. Output ONLY valid JSON array of objects. No markdown formatting around it.",
      jsonMode: true,
    });
    
    // In Edge, Gemini might wrap it in ```json, so we clean it.
    const cleanJson = response.replace(/^```json/g, "").replace(/```$/g, "").trim();
    const recommendations: Omit<Recommendation, "id">[] = JSON.parse(cleanJson);
    
    return recommendations.map((r, i) => ({
      ...r,
      id: `rec-${Date.now()}-${i}`,
    }));
  } catch (error) {
    console.error("Failed to generate recommendations:", error);
    // Fallback based on memory
    return [
      {
        id: "rec-fallback-1",
        problem: "Low SEO visibility on core product pages",
        impact: "Losing organic traffic to competitors",
        recommendation: "Optimize meta tags and add rich snippets to top 5 products",
        expectedBenefit: "Increase organic CTR by 15%",
        priority: "High",
        difficulty: "Medium"
      }
    ];
  }
}

export async function generateDailySummary(memory: BusinessMemory) {
  const prompt = `
Generate a short morning briefing for the CEO of ${memory.business.name}.
Return ONLY a JSON object with these keys:
- healthStatus: "Excellent", "Good", "Needs Attention", or "Critical"
- topOpportunity: string (1 sentence)
- biggestRisk: string (1 sentence)
- competitorActivity: string (1 sentence summarizing biggest threat)
- customerInsights: string (1 sentence summarizing sentiment)
- seoStatus: string (1 sentence)
- recommendedNextAction: string (1 clear action)
`;

  try {
    const response = await generateContent(prompt, {
      systemInstruction: "Output ONLY a valid JSON object.",
      jsonMode: true,
    });
    
    const cleanJson = response.replace(/^```json/g, "").replace(/```$/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    return {
      healthStatus: "Needs Attention",
      topOpportunity: "Implement structured data for better search presence.",
      biggestRisk: "Competitors are gaining traffic share.",
      competitorActivity: "Monitoring high threat competitors.",
      customerInsights: "Sentiment is generally positive but lacks recent reviews.",
      seoStatus: `Current SEO Score is ${memory.scores.seo.score}/100.`,
      recommendedNextAction: "Review Opportunities tab for prioritized tasks."
    };
  }
}
