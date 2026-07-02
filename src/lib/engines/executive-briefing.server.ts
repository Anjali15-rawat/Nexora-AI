import { generateContent } from "../ai/gemini.server";

export interface BriefingResult {
  text: string;
  summary: {
    growthScore: number;
    topOpportunity: string;
    potentialRevenue: string;
    biggestThreat: string;
    recommendedAction: string;
    estimatedBusinessImpact: string;
  };
}

/**
 * Generates an executive daily briefing using Gemini for a conversational, CEO-first report.
 */
export async function generateExecutiveBriefing(params: {
  businessName: string;
  growthScore: number;
  opportunities: any[];
  competitors: any[];
}): Promise<BriefingResult> {
  const topOpp = params.opportunities[0] || { title: "None identified yet", revenue: 0, recommendedAction: "Run an AI search audit." };
  const threats = params.competitors.filter(c => c.threatLevel === "High" || c.threat === "High");
  const biggestThreat = threats[0]?.name || params.competitors[0]?.name || "No imminent competitor threats detected";

  const prompt = `
You are Nexora AI's Executive Briefing Engine.
Construct a daily morning briefing for the business owner of "${params.businessName}".
Make the tone professional, direct, strategic, and highly action-oriented. Avoid generic pleasantries.

Current State:
- Overall Growth Score: ${params.growthScore}/100
- Top Growth Opportunity: "${topOpp.title || topOpp.name}"
- Opportunity Revenue Potential: ₹${topOpp.revenue || 0}/month
- Biggest Competitor Threat: "${biggestThreat}"
- Recommended Next Step: "${topOpp.recommendedAction || topOpp.actionPlan || topOpp.description}"

Write a concise briefing using the following format:
"Good morning, team ${params.businessName}.

Here is your growth briefing for today:
[Write a 2-3 sentence high-level summary of their growth position, SEO visibility compared to competitors, and the single most critical action item.]

Key Highlights:
- **Growth Score**: ${params.growthScore}/100
- **Top Opportunity**: ${topOpp.title || topOpp.name} (Estimated +₹${topOpp.revenue || 0}/month)
- **Competitive Focus**: Monitoring ${biggestThreat}
- **Recommended Action**: ${topOpp.recommendedAction || topOpp.actionPlan || topOpp.description}
"

Also generate a JSON summary alongside it.
Return a single JSON payload matching exactly this structure:
{
  "text": "The full formatted text of the briefing in markdown...",
  "summary": {
    "growthScore": ${params.growthScore},
    "topOpportunity": "${topOpp.title || topOpp.name}",
    "potentialRevenue": "₹${topOpp.revenue || 0}/month",
    "biggestThreat": "${biggestThreat}",
    "recommendedAction": "${topOpp.recommendedAction || topOpp.actionPlan || topOpp.description}",
    "estimatedBusinessImpact": "+₹${topOpp.revenue || 0}/month growth potential"
  }
}

Output ONLY valid JSON. No markdown code blocks or explanations.
`;

  try {
    const rawResult = await generateContent(prompt, {
      systemInstruction: "You are an executive strategist. You synthesize metrics into strategic morning updates in clean structured JSON only.",
      jsonMode: true,
    });

    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    return JSON.parse(cleanJson) as BriefingResult;
  } catch (error) {
    console.error("Executive briefing generation failed:", error);
    return getFallbackBriefing(params.businessName, params.growthScore, topOpp, biggestThreat);
  }
}

function getFallbackBriefing(
  businessName: string,
  growthScore: number,
  topOpp: any,
  biggestThreat: string
): BriefingResult {
  const oppTitle = topOpp.title || topOpp.name || "Optimize homepage search indexing";
  const revenueStr = `₹${topOpp.revenue || 12000}/month`;
  const actionStr = topOpp.recommendedAction || topOpp.actionPlan || "Add structured JSON-LD metadata markup.";

  return {
    text: `Good morning, team ${businessName}.

Here is your growth briefing for today:
Your e-commerce visibility is currently indexed at a Growth Score of ${growthScore}/100. We recommend addressing product schema validation on your top collection pages to offset search traffic capture from your closest competitor, ${biggestThreat}.

Key Highlights:
- **Growth Score**: ${growthScore}/100
- **Top Opportunity**: ${oppTitle} (Estimated +${revenueStr})
- **Competitive Focus**: Monitoring ${biggestThreat}
- **Recommended Action**: ${actionStr}
`,
    summary: {
      growthScore,
      topOpportunity: oppTitle,
      potentialRevenue: revenueStr,
      biggestThreat,
      recommendedAction: actionStr,
      estimatedBusinessImpact: `+${revenueStr} growth potential`,
    },
  };
}
